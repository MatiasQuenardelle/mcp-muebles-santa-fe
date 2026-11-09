import { NextResponse } from 'next/server'
import { crearCompra, parseCompraNueva } from '@/lib/gestion/compras'
import { InputError } from '@/lib/gestion/entrada'
import { requireOwner } from '@/lib/session'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño carga compras.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    const compra = parseCompraNueva(cuerpo)
    await crearCompra(compra, user.id)
    return NextResponse.json({ ok: true, id: compra.id })
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo guardar la compra', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
