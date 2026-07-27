import { NextResponse } from 'next/server'

const MAX_MESSAGE = 1500
const MAX_TRANSCRIPT = 12
const MAX_TRANSCRIPT_ITEM = 1500

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 })
  }

  const input = body as Record<string, unknown>

  const rawTranscript = Array.isArray(input.transcript) ? input.transcript : []
  const transcript = rawTranscript
    .slice(-MAX_TRANSCRIPT)
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null
      }
      const { role, content } = item as { role?: unknown; content?: unknown }
      const cleanContent = str(content, MAX_TRANSCRIPT_ITEM)
      if (!cleanContent) {
        return null
      }
      return { role: role === 'user' ? 'user' : 'assistant', content: cleanContent }
    })
    .filter((item): item is { role: string; content: string } => item !== null)

  const record = {
    name: str(input.name, 120),
    phone: str(input.phone, 40),
    message: str(input.message, MAX_MESSAGE),
    source: str(input.source, 60) ?? 'unknown',
    page: str(input.page, 200) ?? '/',
    attribution: input.attribution ?? null,
    transcript,
    receivedAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') ?? '',
  }

  const webhook = (process.env.LEAD_WEBHOOK_URL ?? '').trim()

  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
    } catch (error) {
      console.error('Lead webhook error', error)
    }
  } else {
    console.log('LEAD', JSON.stringify(record))
  }

  return NextResponse.json({ ok: true })
}
