import { NextResponse } from 'next/server'
import { crearTarea, parseTarea } from '@/lib/gestion/equipo'
import { requireOwner } from '@/lib/session'
import { responderError } from '../errores'

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño carga tareas.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    await crearTarea(parseTarea(cuerpo), user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'crear la tarea')
  }
}
