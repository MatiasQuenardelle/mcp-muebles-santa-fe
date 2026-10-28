import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/auth'
import { clientIp, hashIp } from '@/lib/db'
import { hashPassword, passwordProblem } from '@/lib/password'
import {
  LOCKOUT_MESSAGE,
  SESSION_COOKIE_OPTIONS,
  consumeInvite,
  createSession,
  getInviteUser,
  isLoginLocked,
  recordLoginFailure,
} from '@/lib/session'

// El link de invitación trae el token en el fragmento (#), que el navegador no
// manda al server ni deja en los logs: la página lo lee y lo postea acá.
//   { token }            -> a quién corresponde (para mostrar "Hola, Marcelo")
//   { token, password }  -> elige la contraseña y queda logueado
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const token = body.token
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  }

  // Probar tokens al azar es inútil (son 256 bits), pero igual se frena por IP.
  // Solo por IP: una clave común a todos dejaría trabar las invitaciones ajenas.
  const ipHash = await hashIp(clientIp(request))
  const ipKey = ipHash ? `ip:${ipHash}` : null
  if (await isLoginLocked('', ipKey)) {
    return NextResponse.json({ error: LOCKOUT_MESSAGE }, { status: 429 })
  }

  const user = await getInviteUser(token)
  if (!user) {
    await recordLoginFailure('', ipKey)
    return NextResponse.json(
      { error: 'Este link ya se usó o venció. Pedí uno nuevo a quien te invitó.' },
      { status: 410 }
    )
  }

  if (body.password === undefined) {
    return NextResponse.json({
      name: user.name,
      email: user.email,
      isReset: user.has_password,
    })
  }

  if (typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Contraseña inválida.' }, { status: 400 })
  }
  const problem = passwordProblem(body.password)
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 })
  }

  const userId = await consumeInvite(token, await hashPassword(body.password))
  if (!userId) {
    return NextResponse.json({ error: 'Este link ya se usó o venció.' }, { status: 410 })
  }

  const session = await createSession(userId, request.headers.get('user-agent'))
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, session.cookie, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: session.maxAge,
  })
  return response
}
