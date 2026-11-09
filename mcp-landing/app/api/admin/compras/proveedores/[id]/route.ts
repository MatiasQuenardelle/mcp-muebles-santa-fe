import { NextResponse } from 'next/server'
import { actualizarProveedor, parseProveedorDatos, uuidValido } from '@/lib/gestion/compras'
import { InputError } from '@/lib/gestion/entrada'
import { requireOwner } from '@/lib/session'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño modifica proveedores.' }, { status: 403 })
  }
  if (!uuidValido(params.id)) {
    return NextResponse.json({ error: 'No se encontró ese proveedor.' }, { status: 404 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    if (!(await actualizarProveedor(params.id, parseProveedorDatos(cuerpo)))) {
      return NextResponse.json({ error: 'No se encontró ese proveedor.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo guardar el proveedor', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
