import { NextResponse } from 'next/server'
import { crearNota, responderError } from '@/lib/gestion/caja'
import { requireOwner } from '@/lib/session'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño administra los datos de la empresa.' }, { status: 403 })
  }
  try {
    await crearNota(await request.json().catch(() => null), user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'No se pudo crear la nota')
  }
}
