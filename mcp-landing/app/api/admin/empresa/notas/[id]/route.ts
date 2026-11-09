import { NextResponse } from 'next/server'
import { actualizarNota, borrarNota, responderError } from '@/lib/gestion/caja'
import { requireOwner } from '@/lib/session'

const NO_DUENO = 'Solo el dueño administra los datos de la empresa.'
const NO_EXISTE = 'No se encontró esa nota.'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: NO_DUENO }, { status: 403 })
  }
  try {
    if (!(await actualizarNota(params.id, await request.json().catch(() => null), user.id))) {
      return NextResponse.json({ error: NO_EXISTE }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo actualizar la nota')
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: NO_DUENO }, { status: 403 })
  }
  try {
    if (!(await borrarNota(params.id))) {
      return NextResponse.json({ error: NO_EXISTE }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo borrar la nota')
  }
}
