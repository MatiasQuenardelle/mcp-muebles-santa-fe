import { NextResponse } from 'next/server'
import { isDatabaseConfigured, saveLead } from '@/lib/db'
import { notifyPhoneLead } from '@/lib/notify'

const MAX_MESSAGE = 1500

const CONVERSATION_COOKIE = 'mcp_cid'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

// La misma cookie que usa /api/chat: permite atribuir el clic a WhatsApp a la
// conversación que lo originó, sin confiar en un id mandado por el cliente.
function readConversationCookie(request: Request): string | null {
  const header = request.headers.get('cookie')
  if (!header) {
    return null
  }
  const match = header.match(new RegExp(`(?:^|; )${CONVERSATION_COOKIE}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]) : null
  return value && UUID_RE.test(value) ? value : null
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
  const conversationId = readConversationCookie(request)

  const record = {
    name: str(input.name, 120),
    phone: str(input.phone, 40),
    message: str(input.message, MAX_MESSAGE),
    source: str(input.source, 60) ?? 'unknown',
    page: str(input.page, 200) ?? '/',
    attribution: input.attribution ?? null,
    conversationId,
    receivedAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') ?? '',
  }

  if (isDatabaseConfigured()) {
    try {
      await saveLead({
        conversationId,
        source: record.source,
        page: record.page,
        name: record.name ?? null,
        phone: record.phone ?? null,
        message: record.message ?? null,
        attribution: record.attribution,
        userAgent: record.userAgent || null,
      })
    } catch (error) {
      console.error('No se pudo guardar el lead', error)
    }
  }

  // Aviso instantáneo solo para el teléfono dejado en el chat: los clics a
  // WhatsApp ya le llegan al dueño como mensaje real y avisarlos sería ruido.
  // Con `await`: Vercel congela la lambda apenas responde.
  if (record.source === 'chatbot') {
    await notifyPhoneLead({
      conversationId,
      name: record.name ?? null,
      phone: record.phone ?? null,
      message: record.message ?? null,
      page: record.page,
      attribution: record.attribution,
    })
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
  } else if (!isDatabaseConfigured()) {
    console.log('LEAD', JSON.stringify(record))
  }

  return NextResponse.json({ ok: true })
}
