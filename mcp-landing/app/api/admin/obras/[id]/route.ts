import { NextResponse } from 'next/server'
import { actualizarObra, parseEdicionObra } from '@/lib/gestion/obras'
import { requireOwner } from '@/lib/session'
import { idDeObra, respuestaDeError } from '../respuestas'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño edita los datos de una obra.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    await actualizarObra(idDeObra(params.id), parseEdicionObra(cuerpo))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return respuestaDeError(error, 'No se pudo editar la obra')
  }
}
