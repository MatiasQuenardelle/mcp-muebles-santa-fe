import { NextResponse } from 'next/server'
import { liberarEvento, registrarEvento } from '@/lib/whatsapp/db'
import { procesarEvento } from '@/lib/whatsapp/eventos'
import { firmaValida, separarEventos } from '@/lib/whatsapp/webhook'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 1_048_576

// Público a propósito (Kapso no tiene sesión): lo que lo protege es la firma.
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: 'Muy grande.' }, { status: 413 })
  }

  const rawBody = await request.text()
  if (!firmaValida(rawBody, process.env.KAPSO_WEBHOOK_SECRET, request.headers.get('x-webhook-signature'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const eventHeader = request.headers.get('x-webhook-event')
  const idempotencia = request.headers.get('x-idempotency-key')
  if (idempotencia && !(await registrarEvento(idempotencia, eventHeader))) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    for (const evento of separarEventos(body, eventHeader)) {
      await procesarEvento(evento)
    }
  } catch (error) {
    console.error('[whatsapp] Error procesando el webhook', error)
    if (idempotencia) {
      await liberarEvento(idempotencia).catch(() => undefined)
    }
    // Con 500, Kapso reintenta en vez de perder el mensaje.
    return NextResponse.json({ error: 'No se pudo procesar.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
