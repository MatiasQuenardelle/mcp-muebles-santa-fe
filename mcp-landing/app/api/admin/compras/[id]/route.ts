import { NextResponse } from 'next/server'
import {
  cancelarCompra,
  editarPedido,
  parseCompraDatos,
  parseRecepcion,
  recibirCompra,
  uuidValido,
} from '@/lib/gestion/compras'
import { InputError, parseEnum } from '@/lib/gestion/entrada'
import { requireOwner } from '@/lib/session'

const ACCIONES = ['editar', 'recibir', 'cancelar'] as const

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño modifica compras.' }, { status: 403 })
  }
  if (!uuidValido(params.id)) {
    return NextResponse.json({ error: 'No se encontró esa compra.' }, { status: 404 })
  }
  const cuerpo = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!cuerpo) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  try {
    const accion = parseEnum(cuerpo.accion, ACCIONES, 'Acción')
    const hecho =
      accion === 'editar'
        ? await editarPedido(params.id, parseCompraDatos(cuerpo))
        : accion === 'recibir'
          ? await recibirCompra(params.id, parseRecepcion(cuerpo))
          : await cancelarCompra(params.id)
    if (!hecho) {
      return NextResponse.json(
        { error: 'Esa compra cambió de estado mientras la mirabas. Recargá la pantalla.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo modificar la compra', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
