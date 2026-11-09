import { NextResponse } from 'next/server'
import { actualizarGastoFijo, borrarGastoFijo, responderError } from '@/lib/gestion/caja'
import { requireOwner } from '@/lib/session'

const NO_DUENO = 'Solo el dueño administra los gastos fijos.'
const NO_EXISTE = 'No se encontró ese gasto fijo.'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: NO_DUENO }, { status: 403 })
  }
  try {
    if (!(await actualizarGastoFijo(params.id, await request.json().catch(() => null)))) {
      return NextResponse.json({ error: NO_EXISTE }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo actualizar el gasto fijo')
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: NO_DUENO }, { status: 403 })
  }
  try {
    if (!(await borrarGastoFijo(params.id))) {
      return NextResponse.json({ error: NO_EXISTE }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo borrar el gasto fijo')
  }
}
