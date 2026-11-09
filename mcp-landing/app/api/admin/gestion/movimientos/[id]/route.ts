import { NextResponse } from 'next/server'
import { InputError, parseTexto, parseUuid } from '@/lib/gestion/entrada'
import { anularMovimiento } from '@/lib/gestion/movimientos'
import { requireOwner } from '@/lib/session'

// El libro no borra: DELETE marca el movimiento como anulado y guarda el motivo.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño anula movimientos.' }, { status: 403 })
  }
  const cuerpo = (await request.json().catch(() => null)) as { motivo?: unknown } | null
  try {
    const anulado = await anularMovimiento(
      parseUuid(params.id),
      parseTexto(cuerpo?.motivo, 'el motivo', 300),
      user.id
    )
    if (!anulado) {
      return NextResponse.json({ error: 'Ese movimiento ya estaba anulado.' }, { status: 409 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo anular el movimiento', error)
    return NextResponse.json({ error: 'Error al anular.' }, { status: 500 })
  }
}
