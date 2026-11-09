import { NextResponse } from 'next/server'
import { actualizarCuenta, responderError } from '@/lib/gestion/caja'
import { requireOwner } from '@/lib/session'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño administra las cuentas.' }, { status: 403 })
  }
  try {
    if (!(await actualizarCuenta(params.id, await request.json().catch(() => null)))) {
      return NextResponse.json({ error: 'No se encontró esa cuenta.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo actualizar la cuenta')
  }
}
