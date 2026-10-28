import { NextResponse } from 'next/server'
import {
  countActiveOwners,
  createInvite,
  getUser,
  inviteUrl,
  requireOwner,
  revokeAllSessions,
  setTotp,
  updateUser,
} from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Acciones del dueño sobre un usuario:
//   invite        -> link nuevo (alta pendiente o restablecer contraseña)
//   deactivate    -> lo saca del panel en el acto; activate lo devuelve
//   logout        -> cierra todas sus sesiones
//   reset-totp    -> le apaga la verificación en dos pasos (perdió el celular)
//   role          -> owner | user
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const owner = await requireOwner(request)
  if (!owner) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const target = await getUser(params.id)
  if (!target) {
    return NextResponse.json({ error: 'No existe ese usuario.' }, { status: 404 })
  }

  // Nunca dejar el panel sin nadie que pueda administrarlo.
  const removesOwner =
    target.role === 'owner' &&
    target.active &&
    (body.action === 'deactivate' || (body.action === 'role' && body.role !== 'owner'))
  if (removesOwner && (await countActiveOwners()) <= 1) {
    return NextResponse.json({ error: 'Tiene que quedar al menos un dueño activo.' }, { status: 400 })
  }

  switch (body.action) {
    case 'invite': {
      const token = await createInvite(target.id)
      return NextResponse.json({ ok: true, inviteUrl: inviteUrl(request, token) })
    }
    case 'deactivate':
      await updateUser(target.id, { active: false })
      return NextResponse.json({ ok: true })
    case 'activate':
      await updateUser(target.id, { active: true })
      return NextResponse.json({ ok: true })
    case 'logout':
      await revokeAllSessions(target.id)
      return NextResponse.json({ ok: true })
    case 'reset-totp':
      await setTotp(target.id, null, false)
      return NextResponse.json({ ok: true })
    case 'role':
      if (body.role !== 'owner' && body.role !== 'user') {
        return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
      }
      await updateUser(target.id, { role: body.role })
      return NextResponse.json({ ok: true })
    default:
      return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 })
  }
}
