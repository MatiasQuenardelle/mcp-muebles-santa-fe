import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_DAYS,
  checkPassword,
  createSessionToken,
  isAdminConfigured,
} from '@/lib/auth'

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'El panel no está configurado (faltan ADMIN_PASSWORD / ADMIN_SESSION_SECRET).' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const password = (body as { password?: unknown })?.password
  if (typeof password !== 'string' || !(await checkPassword(password))) {
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
  }

  const token = await createSessionToken()
  if (!token) {
    return NextResponse.json({ error: 'No se pudo crear la sesión.' }, { status: 503 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_DAYS * 86_400,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
