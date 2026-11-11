import { NextResponse } from 'next/server'
import { getConversation } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { cambiarModoDeContacto, cambiarModoGeneral } from '@/lib/whatsapp/control'
import { esModoBot } from '@/lib/whatsapp/modo'

export const dynamic = 'force-dynamic'
// Cambiar el modo general toca cada charla reciente en Kapso.
export const maxDuration = 30

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Con conversationId cambia ese contacto (mode null = usar el general). Sin él,
// cambia el modo general, que es solo del dueño.
export async function PATCH(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    conversationId?: unknown
    mode?: unknown
  } | null

  try {
    if (body?.conversationId === undefined) {
      if (user.role !== 'owner') {
        return NextResponse.json({ error: 'Solo el dueño cambia el modo general.' }, { status: 403 })
      }
      if (!esModoBot(body?.mode)) {
        return NextResponse.json({ error: 'Modo inválido.' }, { status: 400 })
      }
      await cambiarModoGeneral(body.mode)
      return NextResponse.json({ ok: true })
    }

    const { conversationId, mode } = body
    if (typeof conversationId !== 'string' || !UUID_RE.test(conversationId)) {
      return NextResponse.json({ error: 'Id inválido.' }, { status: 400 })
    }
    if (mode !== null && !esModoBot(mode)) {
      return NextResponse.json({ error: 'Modo inválido.' }, { status: 400 })
    }
    const conversation = await getConversation(conversationId, user)
    if (!conversation?.wa_phone) {
      return NextResponse.json({ error: 'No se encontró ese contacto.' }, { status: 404 })
    }
    await cambiarModoDeContacto(
      {
        id: conversation.id,
        wa_phone: conversation.wa_phone,
        ai_mode_override: conversation.ai_mode_override,
      },
      mode
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[whatsapp] No se pudo cambiar el modo', error)
    return NextResponse.json({ error: 'No se pudo conectar con Kapso. Probá de nuevo.' }, { status: 502 })
  }
}
