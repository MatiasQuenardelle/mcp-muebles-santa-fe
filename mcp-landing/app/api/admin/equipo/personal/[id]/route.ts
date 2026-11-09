import { NextResponse } from 'next/server'
import { parseUuid } from '@/lib/gestion/entrada'
import { actualizarPersona, parsePersona } from '@/lib/gestion/equipo'
import { requireOwner } from '@/lib/session'
import { responderError } from '../../errores'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño administra el equipo.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    if (!(await actualizarPersona(parseUuid(params.id, 'Persona'), parsePersona(cuerpo)))) {
      return NextResponse.json({ error: 'No se encontró esa persona.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'actualizar la persona')
  }
}
