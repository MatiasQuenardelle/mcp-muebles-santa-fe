import { NextResponse } from 'next/server'
import { addActivity, getConversation } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { pausarPorIntervencionHumana } from '@/lib/whatsapp/control'
import { guardarMensajeDelPanel, leerConfig } from '@/lib/whatsapp/db'
import { ErrorKapso, enviarTexto } from '@/lib/whatsapp/kapso'
import { ventanaAbierta } from '@/lib/whatsapp/modo'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_LARGO = 4000
const AVISO_VENTANA =
  'Pasaron más de 24 horas desde el último mensaje del cliente: WhatsApp solo deja escribirle con una plantilla aprobada.'

export async function POST(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    conversationId?: unknown
    text?: unknown
  } | null
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : ''
  if (!UUID_RE.test(conversationId) || !text || text.length > MAX_LARGO) {
    return NextResponse.json({ error: 'Mensaje inválido.' }, { status: 400 })
  }

  const [conversation, config] = await Promise.all([
    getConversation(conversationId, user),
    leerConfig(),
  ])
  if (!conversation?.wa_phone || !config.phone_number_id) {
    return NextResponse.json({ error: 'No se encontró ese chat de WhatsApp.' }, { status: 404 })
  }
  if (!ventanaAbierta(conversation.last_inbound_at, Date.now())) {
    return NextResponse.json({ error: AVISO_VENTANA }, { status: 409 })
  }

  let waMessageId: string | null
  try {
    waMessageId = await enviarTexto(config.phone_number_id, conversation.wa_phone, text)
  } catch (error) {
    console.error('[whatsapp] No se pudo enviar', error)
    const fueraDeVentana = error instanceof ErrorKapso && /131026|131047/.test(error.message)
    return NextResponse.json(
      { error: fueraDeVentana ? AVISO_VENTANA : 'WhatsApp no aceptó el mensaje. Probá de nuevo.' },
      { status: 502 }
    )
  }

  // Ya salió: lo que falle de acá en adelante no puede hacer que se reenvíe.
  try {
    await guardarMensajeDelPanel({ conversationId, content: text, waMessageId })
    await pausarPorIntervencionHumana({
      id: conversation.id,
      wa_phone: conversation.wa_phone,
      ai_mode_override: conversation.ai_mode_override,
    })
    if (conversation.status === 'nuevo') {
      await addActivity(conversation.id, 'whatsapp', 'Respondió por WhatsApp desde el panel.', user.id)
    }
  } catch (error) {
    console.error('[whatsapp] Se envió pero no se pudo registrar', error)
  }

  return NextResponse.json({ ok: true })
}
