import { NextResponse } from 'next/server'
import {
  TOPE_PREGUNTAS_MES,
  consumirPregunta,
  parsearMensajes,
  registrarFallo,
  responderAsistente,
} from '@/lib/gestion/asistente'
import { InputError } from '@/lib/gestion/entrada'
import { requireAdmin } from '@/lib/session'

export const maxDuration = 30

export async function POST(request: Request) {
  const cuerpo = await request.json().catch(() => null)
  const user = await requireAdmin(request)

  // Toda respuesta que no es una contestación queda registrada en asistente_fallos.
  async function fallar(estado: number, error: string, motivo = error) {
    await registrarFallo({ usuario: user?.id ?? null, estado, motivo, cuerpo })
    return NextResponse.json({ error }, { status: estado })
  }

  // La cookie firmada pasó el middleware, pero la sesión ya no está en la base.
  if (!user) {
    return fallar(401, 'Tu sesión venció. Volvé a entrar al panel.')
  }
  if (user.role !== 'owner') {
    return fallar(403, 'El asistente es solo para dueños.')
  }
  const apiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  if (!apiKey) {
    return fallar(503, 'El asistente no está configurado: falta la clave de OpenAI en el servidor.')
  }
  try {
    const mensajes = parsearMensajes(cuerpo)
    if (!(await consumirPregunta())) {
      return fallar(429, `Se llegó al tope de ${TOPE_PREGUNTAS_MES} preguntas de este mes. Se renueva el día 1.`)
    }
    return NextResponse.json(await responderAsistente(mensajes, { fetch, viewer: user, apiKey }))
  } catch (error) {
    if (error instanceof InputError) {
      return fallar(400, error.message)
    }
    console.error('El asistente no pudo responder', error)
    return fallar(
      502,
      'El asistente no pudo responder. Probá de nuevo en un momento.',
      error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    )
  }
}
