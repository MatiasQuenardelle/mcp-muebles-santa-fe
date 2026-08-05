import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateCard } from '@/lib/card'
import { CONVERSATION_STATUSES, type ConversationStatus } from '@/lib/crm'
import { getMessages, saveCard, updateConversation } from '@/lib/db'
import { notifyHotLead } from '@/lib/notify'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const fields: { status?: ConversationStatus; notes?: string } = {}

  if (input.status !== undefined) {
    const status = input.status
    if (
      typeof status !== 'string' ||
      !CONVERSATION_STATUSES.includes(status as ConversationStatus)
    ) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
    }
    fields.status = status as ConversationStatus
  }

  if (input.notes !== undefined) {
    if (typeof input.notes !== 'string') {
      return NextResponse.json({ error: 'Notas inválidas.' }, { status: 400 })
    }
    fields.notes = input.notes.slice(0, 4000)
  }

  try {
    if (Object.keys(fields).length > 0) {
      await updateConversation(params.id, fields)
    }
    // Regeneración a pedido desde el detalle. Se hace acá y no encolándola: la
    // cola solo toma charlas quietas hace 20 minutos, así que una conversación
    // recién terminada nunca se regeneraría. Una sola tarjeta son ~2s, entra
    // holgada en el timeout de 10s de Vercel Hobby.
    if (input.regenerateCard === true) {
      const messages = await getMessages(params.id)
      const card = await generateCard(messages)
      if (!card) {
        return NextResponse.json({ error: 'No se pudo generar el resumen.' }, { status: 502 })
      }
      await saveCard(params.id, card, messages.length)
      await notifyHotLead(params.id, card)
    }
  } catch (error) {
    console.error('No se pudo actualizar la conversación', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
