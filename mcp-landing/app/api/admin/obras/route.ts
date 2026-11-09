import { NextResponse } from 'next/server'
import { crearObra, parseObraNueva } from '@/lib/gestion/obras'
import { requireOwner } from '@/lib/session'
import { respuestaDeError } from './respuestas'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño crea obras.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    return NextResponse.json(await crearObra(parseObraNueva(cuerpo), user.id))
  } catch (error) {
    return respuestaDeError(error, 'No se pudo crear la obra')
  }
}
