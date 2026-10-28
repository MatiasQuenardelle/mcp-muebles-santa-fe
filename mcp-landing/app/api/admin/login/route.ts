import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, isAdminConfigured, readCookie } from '@/lib/auth'
import { clientIp, hashIp, isDatabaseConfigured } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import {
  LOCKOUT_MESSAGE,
  SESSION_COOKIE_OPTIONS,
  clearLoginFailures,
  createSession,
  findUserForLogin,
  isLoginLocked,
  normalizeEmail,
  recordLoginFailure,
  revokeSessionFromCookie,
} from '@/lib/session'
import { decryptSecret, verifyTotp } from '@/lib/totp'

// Un solo mensaje para email inexistente, contraseña mala o usuario dado de
// baja: no se le confirma a nadie qué emails tienen cuenta.
const BAD_CREDENTIALS = 'Email o contraseña incorrectos.'

export async function POST(request: Request) {
  if (!isAdminConfigured() || !isDatabaseConfigured()) {
    return NextResponse.json({ error: 'El panel no está configurado.' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const { email, password, code } = body
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ error: 'Completá email y contraseña.' }, { status: 400 })
  }

  const emailKey = `email:${normalizeEmail(email)}`
  const ipHash = await hashIp(clientIp(request))
  const ipKey = ipHash ? `ip:${ipHash}` : null

  if (await isLoginLocked(emailKey, ipKey)) {
    return NextResponse.json({ error: LOCKOUT_MESSAGE }, { status: 429 })
  }

  const user = await findUserForLogin(email)
  // verifyPassword gasta un hash aunque no haya usuario: mismo tiempo de respuesta.
  const passwordOk = await verifyPassword(password, user?.password_hash ?? null)
  if (!user || !user.active || !passwordOk) {
    await recordLoginFailure(emailKey, ipKey)
    return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 })
  }

  // Segundo paso. Se pide recién con la contraseña bien, y un código malo
  // cuenta como intento fallido igual que una contraseña mala.
  if (user.totp_enabled && user.totp_secret) {
    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ needsCode: true })
    }
    if (!verifyTotp(decryptSecret(user.totp_secret), code)) {
      await recordLoginFailure(emailKey, ipKey)
      return NextResponse.json({ error: 'Código incorrecto.', needsCode: true }, { status: 401 })
    }
  }

  await clearLoginFailures(emailKey)
  const session = await createSession(user.id, request.headers.get('user-agent'))
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, session.cookie, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: session.maxAge,
  })
  return response
}

// Salir: además de borrar la cookie, la sesión queda cerrada en la base.
export async function DELETE(request: Request) {
  await revokeSessionFromCookie(readCookie(request, ADMIN_COOKIE)).catch(() => {})
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
