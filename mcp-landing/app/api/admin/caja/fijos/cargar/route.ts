import { NextResponse } from 'next/server'
import { cargarGastosFijos, responderError } from '@/lib/gestion/caja'
import { requireOwner } from '@/lib/session'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño carga movimientos de plata.' }, { status: 403 })
  }
  try {
    const resultados = await cargarGastosFijos(await request.json().catch(() => null), user.id)
    return NextResponse.json({ ok: true, resultados })
  } catch (error) {
    return responderError(error, 'No se pudieron cargar los gastos fijos')
  }
}
