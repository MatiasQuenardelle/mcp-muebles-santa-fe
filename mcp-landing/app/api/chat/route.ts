import Anthropic from '@anthropic-ai/sdk'
import { baseConocimiento } from '@/lib/asistente/knowledge-base'

// El asistente corre en el servidor para no exponer la API key en el navegador.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Modelo configurable por variable de entorno. Por defecto usamos Claude Opus 4.8.
// Para un chatbot de alto volumen y bajo costo se puede poner ANTHROPIC_MODEL=claude-haiku-4-5
const MODEL = (process.env.ANTHROPIC_MODEL || 'claude-opus-4-8').trim()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function construirSystemPrompt(): string {
  const { empresa, formaDeAtender, informacion, contacto } = baseConocimiento

  return [
    `Sos el asistente virtual de "${empresa.nombre}", una empresa de ${empresa.rubro} en ${empresa.zona}. ${empresa.experiencia}.`,
    '',
    'CÓMO ATENDER:',
    formaDeAtender,
    '',
    'REGLA MÁS IMPORTANTE (no la rompas nunca):',
    'Solo podés responder usando la INFORMACIÓN que aparece abajo. No inventes ni supongas precios, plazos, materiales ni condiciones. Si el cliente pregunta algo que no está en la información, decí con honestidad que no tenés ese dato y ofrecele seguir la conversación por WhatsApp con Marcelo. Nunca des información de otras empresas ni respondas temas ajenos a MCP.',
    '',
    'Cuando sea natural, invitá a seguir por WhatsApp con esta idea:',
    `"${contacto.invitacionWhatsApp}"`,
    '',
    'Respondé siempre en pocas líneas, en español rioplatense (de vos).',
    '',
    '===== INFORMACIÓN DISPONIBLE (lo único que podés usar) =====',
    informacion,
    '===== FIN DE LA INFORMACIÓN =====',
  ].join('\n')
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Si no hay API key configurada, el frontend usa el modo guiado (preguntas
  // frecuentes) automáticamente. Avisamos con un 503 para que haga el fallback.
  if (!apiKey) {
    return Response.json(
      { error: 'assistant_not_configured' },
      { status: 503 }
    )
  }

  let messages: ChatMessage[]
  try {
    const body = await request.json()
    messages = Array.isArray(body?.messages) ? body.messages : []
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  // Solo mensajes válidos y con contenido. Limitamos el historial y el largo
  // para mantener el costo y la latencia bajos.
  const historial = messages
    .filter(
      (m): m is ChatMessage =>
        (m?.role === 'user' || m?.role === 'assistant') &&
        typeof m?.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

  if (historial.length === 0 || historial[historial.length - 1].role !== 'user') {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: construirSystemPrompt(),
      messages: historial,
    })

    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          console.error('Error de streaming del asistente:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Error del asistente:', err)
    return Response.json({ error: 'assistant_error' }, { status: 502 })
  }
}
