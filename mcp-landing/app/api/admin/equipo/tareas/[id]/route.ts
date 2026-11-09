import { NextResponse } from 'next/server'
import { parseUuid } from '@/lib/gestion/entrada'
import { actualizarTarea, borrarTarea, parseTarea } from '@/lib/gestion/equipo'
import { requireOwner } from '@/lib/session'
import { responderError } from '../../errores'

const NO_ENCONTRADA = 'No se encontró esa tarea.'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño edita tareas.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    if (!(await actualizarTarea(parseUuid(params.id, 'Tarea'), parseTarea(cuerpo)))) {
      return NextResponse.json({ error: NO_ENCONTRADA }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'actualizar la tarea')
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño borra tareas.' }, { status: 403 })
  }
  try {
    if (!(await borrarTarea(parseUuid(params.id, 'Tarea')))) {
      return NextResponse.json({ error: NO_ENCONTRADA }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'borrar la tarea')
  }
}
