import { NextResponse } from 'next/server'
import { createInvite, createUser, inviteUrl, requireOwner, type AdminRole } from '@/lib/session'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Alta de un usuario: queda sin contraseña y se devuelve el link de invitación
// para que la elija él. El link se muestra una sola vez (se guarda solo su hash).
export async function POST(request: Request) {
  if (!(await requireOwner(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 160) : ''
  const role: AdminRole = body.role === 'owner' ? 'owner' : 'user'
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Poné nombre y un email válido.' }, { status: 400 })
  }

  const id = await createUser({ name, email, role })
  if (!id) {
    return NextResponse.json({ error: 'Ya hay un usuario con ese email.' }, { status: 409 })
  }
  const token = await createInvite(id)
  return NextResponse.json({ ok: true, id, inviteUrl: inviteUrl(request, token) })
}
