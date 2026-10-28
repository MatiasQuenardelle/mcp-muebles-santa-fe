import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { ADMIN_COOKIE, readCookie } from '@/lib/auth'
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/password'
import {
  getLoginCandidate,
  requireAdmin,
  revokeOtherSessions,
  setPassword,
  setTotp,
} from '@/lib/session'
import { decryptSecret, encryptSecret, generateTotpSecret, totpUri, verifyTotp } from '@/lib/totp'

// Lo que cada uno gestiona de su propia cuenta. Todo lo sensible pide la
// contraseña actual (o un código válido) aunque la sesión esté abierta: una
// compu que quedó logueada no alcanza para tomar la cuenta.
export async function POST(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const account = await getLoginCandidate(user.id)
  if (!account) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const cookie = readCookie(request, ADMIN_COOKIE)

  switch (body.action) {
    case 'password': {
      const { current, next } = body
      if (typeof current !== 'string' || typeof next !== 'string') {
        return NextResponse.json({ error: 'Completá los dos campos.' }, { status: 400 })
      }
      if (!(await verifyPassword(current, account.password_hash))) {
        return NextResponse.json({ error: 'La contraseña actual no es correcta.' }, { status: 400 })
      }
      const problem = passwordProblem(next)
      if (problem) {
        return NextResponse.json({ error: problem }, { status: 400 })
      }
      await setPassword(user.id, await hashPassword(next))
      // Si alguien más la sabía, queda afuera de los otros dispositivos.
      await revokeOtherSessions(user.id, cookie)
      return NextResponse.json({ ok: true })
    }

    case 'totp-start': {
      if (account.totp_enabled) {
        return NextResponse.json({ error: 'Ya está activada.' }, { status: 400 })
      }
      // Se guarda sin activar: recién vale cuando se confirma con un código.
      const secret = generateTotpSecret()
      await setTotp(user.id, encryptSecret(secret), false)
      const uri = totpUri(secret, user.email)
      const qr = await QRCode.toString(uri, { type: 'svg', margin: 1, width: 200 })
      return NextResponse.json({ secret, uri, qr })
    }

    case 'totp-confirm': {
      if (account.totp_enabled || !account.totp_secret || typeof body.code !== 'string') {
        return NextResponse.json({ error: 'Empezá la configuración de nuevo.' }, { status: 400 })
      }
      if (!verifyTotp(decryptSecret(account.totp_secret), body.code)) {
        return NextResponse.json(
          { error: 'El código no coincide. Fijate que la hora del celular esté bien.' },
          { status: 400 }
        )
      }
      await setTotp(user.id, account.totp_secret, true)
      await revokeOtherSessions(user.id, cookie)
      return NextResponse.json({ ok: true })
    }

    case 'totp-disable': {
      if (typeof body.password !== 'string' || !(await verifyPassword(body.password, account.password_hash))) {
        return NextResponse.json({ error: 'La contraseña no es correcta.' }, { status: 400 })
      }
      await setTotp(user.id, null, false)
      return NextResponse.json({ ok: true })
    }

    case 'logout-others': {
      await revokeOtherSessions(user.id, cookie)
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 })
  }
}
