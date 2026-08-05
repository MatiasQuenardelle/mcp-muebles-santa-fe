import { NextResponse } from 'next/server'
import {
  CHAT_MODEL,
  MAX_COMPLETION_TOKENS,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
  SYSTEM_PROMPT,
} from '@/lib/chatbot'
import {
  MAX_MESSAGES_PER_CONVERSATION,
  MAX_NEW_CONVERSATIONS_PER_HOUR,
  clientIp,
  countRecentConversations,
  getMessageCount,
  hashIp,
  isDatabaseConfigured,
  recordTurn,
} from '@/lib/db'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Identifica la conversación del lado del servidor. Si el id lo generara el
// cliente, cualquiera podría postear el id de otro e inyectarle mensajes.
const CONVERSATION_COOKIE = 'mcp_cid'
const CONVERSATION_COOKIE_MAX_AGE = 60 * 60 * 4

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readConversationCookie(request: Request): string | null {
  const header = request.headers.get('cookie')
  if (!header) {
    return null
  }
  const match = header.match(new RegExp(`(?:^|; )${CONVERSATION_COOKIE}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]) : null
  return value && UUID_RE.test(value) ? value : null
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as { messages?: unknown }).messages)
  ) {
    return null
  }

  const rawMessages = (body as { messages: unknown[] }).messages
  if (rawMessages.length === 0) {
    return null
  }

  const messages: ChatMessage[] = []
  for (const raw of rawMessages) {
    if (typeof raw !== 'object' || raw === null) {
      return null
    }
    const { role, content } = raw as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return null
    }
    const trimmed = content.trim()
    if (!trimmed) {
      return null
    }
    messages.push({ role, content: trimmed.slice(0, MAX_MESSAGE_LENGTH) })
  }

  return messages.slice(-MAX_HISTORY_MESSAGES)
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export async function POST(request: Request) {
  const apiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'El asistente no está disponible en este momento.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido.' }, { status: 400 })
  }

  const messages = parseMessages(body)
  if (!messages) {
    return NextResponse.json({ error: 'Formato de mensajes inválido.' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const existingConversationId = readConversationCookie(request)
  const conversationId = existingConversationId ?? crypto.randomUUID()
  const persist = isDatabaseConfigured()

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')

  // Guardar el mensaje del usuario ANTES de llamar a OpenAI: si se guardara
  // después, se perderían justo las conversaciones donde el bot falló, que son
  // las que más le importan a Marcelo.
  if (persist && lastUserMessage) {
    try {
      const ipHash = await hashIp(clientIp(request))

      if (existingConversationId) {
        const count = await getMessageCount(existingConversationId)
        if (count !== null && count >= MAX_MESSAGES_PER_CONVERSATION) {
          return NextResponse.json(
            { error: 'Llegamos al límite de este chat. Seguí por WhatsApp con Marcelo.' },
            { status: 429 }
          )
        }
      } else if (ipHash) {
        const recent = await countRecentConversations(ipHash)
        if (recent >= MAX_NEW_CONVERSATIONS_PER_HOUR) {
          return NextResponse.json(
            { error: 'Demasiadas consultas seguidas. Probá de nuevo más tarde.' },
            { status: 429 }
          )
        }
      }

      await recordTurn({
        conversationId,
        page: str(input.page, 200),
        attribution: input.attribution ?? null,
        userAgent: request.headers.get('user-agent'),
        ipHash,
        role: 'user',
        content: lastUserMessage.content,
      })
    } catch (error) {
      // La base no puede tumbar el chatbot: se pierde el registro, no la respuesta.
      console.error('No se pudo guardar el mensaje del usuario', error)
    }
  }

  function withCookie(response: NextResponse) {
    response.cookies.set(CONVERSATION_COOKIE, conversationId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: CONVERSATION_COOKIE_MAX_AGE,
    })
    return response
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: MAX_COMPLETION_TOKENS,
        temperature: 0.6,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error', response.status, await response.text())
      return withCookie(
        NextResponse.json(
          { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
          { status: 502 }
        )
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const reply = data.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return withCookie(
        NextResponse.json(
          { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
          { status: 502 }
        )
      )
    }

    // Await, no fire-and-forget: Vercel congela la lambda apenas responde y la
    // escritura se perdería en silencio.
    if (persist) {
      try {
        await recordTurn({
          conversationId,
          page: str(input.page, 200),
          attribution: input.attribution ?? null,
          userAgent: request.headers.get('user-agent'),
          ipHash: null,
          role: 'assistant',
          content: reply,
        })
      } catch (error) {
        console.error('No se pudo guardar la respuesta del asistente', error)
      }
    }

    return withCookie(NextResponse.json({ reply }))
  } catch (error) {
    console.error('Chat route error', error)
    return withCookie(
      NextResponse.json(
        { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
        { status: 502 }
      )
    )
  }
}
