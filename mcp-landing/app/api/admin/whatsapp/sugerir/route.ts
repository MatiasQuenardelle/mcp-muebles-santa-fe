import { NextResponse } from 'next/server'
import { CHAT_MODEL } from '@/lib/chatbot'
import { getConversation, getMessages } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { WHATSAPP_PROMPT } from '@/lib/whatsapp/prompt.mjs'
import {
  MAX_MENSAJES_SUGERENCIA,
  charlaComoTexto,
  instruccionesSugerencia,
} from '@/lib/whatsapp/sugerencia'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ERROR = 'No se pudo generar la sugerencia. Probá de nuevo.'

export async function POST(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const apiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  const body = (await request.json().catch(() => null)) as { conversationId?: unknown } | null
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : ''
  if (!UUID_RE.test(conversationId)) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 })
  }

  const conversation = await getConversation(conversationId, user)
  if (!conversation) {
    return NextResponse.json({ error: 'No se encontró ese contacto.' }, { status: 404 })
  }
  const mensajes = (await getMessages(conversationId)).slice(-MAX_MENSAJES_SUGERENCIA)
  if (mensajes.length === 0 || !apiKey) {
    return NextResponse.json({ error: ERROR }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `${WHATSAPP_PROMPT}\n\n${instruccionesSugerencia(mensajes, Date.now())}`,
          },
          { role: 'user', content: `Conversación:\n${charlaComoTexto(mensajes)}` },
        ],
      }),
    })
    if (!response.ok) {
      console.error('[whatsapp] OpenAI', response.status, await response.text())
      return NextResponse.json({ error: ERROR }, { status: 502 })
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const suggestion = data.choices?.[0]?.message?.content?.trim()
    return suggestion
      ? NextResponse.json({ suggestion })
      : NextResponse.json({ error: ERROR }, { status: 502 })
  } catch (error) {
    console.error('[whatsapp] Sugerencia', error)
    return NextResponse.json({ error: ERROR }, { status: 502 })
  }
}
