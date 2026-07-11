import { NextResponse } from 'next/server'
import {
  CHAT_MODEL,
  MAX_COMPLETION_TOKENS,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
  SYSTEM_PROMPT,
} from '@/lib/chatbot'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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
      return NextResponse.json(
        { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
        { status: 502 }
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const reply = data.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return NextResponse.json(
        { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat route error', error)
    return NextResponse.json(
      { error: 'El asistente no pudo responder. Probá de nuevo en un momento.' },
      { status: 502 }
    )
  }
}
