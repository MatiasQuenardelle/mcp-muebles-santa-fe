import { NextResponse } from 'next/server'
import { crearProveedor, parseProveedorDatos } from '@/lib/gestion/compras'
import { InputError, parseUuid } from '@/lib/gestion/entrada'
import { requireOwner } from '@/lib/session'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño carga proveedores.' }, { status: 403 })
  }
  const cuerpo = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!cuerpo) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  try {
    const id = parseUuid(cuerpo.id, 'Identificador del proveedor')
    await crearProveedor(id, parseProveedorDatos(cuerpo))
    return NextResponse.json({ ok: true, id })
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo guardar el proveedor', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
