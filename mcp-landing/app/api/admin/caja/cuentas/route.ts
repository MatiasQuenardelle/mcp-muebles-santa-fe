import { NextResponse } from 'next/server'
import { crearCuenta, responderError } from '@/lib/gestion/caja'
import { requireOwner } from '@/lib/session'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño administra las cuentas.' }, { status: 403 })
  }
  try {
    await crearCuenta(await request.json().catch(() => null))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo crear la cuenta')
  }
}
