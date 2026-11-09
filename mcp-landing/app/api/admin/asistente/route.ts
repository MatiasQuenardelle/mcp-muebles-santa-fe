import { NextResponse } from 'next/server'
import {
  TOPE_PREGUNTAS_MES,
  consumirPregunta,
  parsearMensajes,
  responderAsistente,
} from '@/lib/gestion/asistente'
import { InputError } from '@/lib/gestion/entrada'
import { requireOwner } from '@/lib/session'

export const maxDuration = 30

export async function POST(request: Request) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'El asistente es solo para dueños.' }, { status: 403 })
  }
  const apiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'El asistente no está configurado: falta la clave de OpenAI en el servidor.' },
      { status: 503 }
    )
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    const mensajes = parsearMensajes(cuerpo)
    if (!(await consumirPregunta())) {
      return NextResponse.json(
        { error: `Se llegó al tope de ${TOPE_PREGUNTAS_MES} preguntas de este mes. Se renueva el día 1.` },
        { status: 429 }
      )
    }
    return NextResponse.json(await responderAsistente(mensajes, { fetch, viewer: user, apiKey }))
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('El asistente no pudo responder', error)
    return NextResponse.json(
      { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
      { status: 502 }
    )
  }
}
