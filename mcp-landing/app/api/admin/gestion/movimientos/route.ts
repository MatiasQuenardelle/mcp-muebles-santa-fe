import { NextResponse } from 'next/server'
import { InputError, parseMovimientoNuevo } from '@/lib/gestion/entrada'
import { registrarMovimiento } from '@/lib/gestion/movimientos'
import { requireOwner } from '@/lib/session'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño carga movimientos de plata.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    const { creado } = await registrarMovimiento(parseMovimientoNuevo(cuerpo), user.id)
    return NextResponse.json({ ok: true, creado })
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo registrar el movimiento', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
