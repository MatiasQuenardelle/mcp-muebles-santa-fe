// Server-only: genera la "tarjeta de contacto" que resume una conversación del
// chatbot para el panel del dueño.

import type { ContactCard } from '@/lib/crm'
import type { MessageRow } from '@/lib/db'

// Modelo fijo a propósito: CHAT_MODEL es override-able por env para tunear el
// bot público, y el extractor no debería cambiar junto con él.
const EXTRACTOR_MODEL = 'gpt-4o-mini'

// Parametrizable por rubro: es lo único que hay que tocar para reusar esto en
// otro cliente.
const NEGOCIO =
  'MCP Muebles, una fábrica de cocinas, placards y amoblamientos de melamina a medida en Santa Fe Capital, Argentina'

const EXTRACTOR_PROMPT = `Sos un asistente que analiza conversaciones entre un chatbot de ventas y visitantes de la web de ${NEGOCIO}. Tu tarea es armar una ficha para el dueño, que la va a leer del celular antes de llamar al cliente.

Reglas:
- Extraé SOLO lo que el visitante dijo explícitamente. Nunca inventes ni completes datos.
- Si un dato no aparece en la conversación, devolvé null en ese campo. No pongas "no menciona", "sin datos" ni similares: null.
- El campo "resumen" es obligatorio: 2 o 3 oraciones en castellano argentino contando qué buscaba el visitante y en qué quedó la charla. Escribilo para alguien que NO leyó el chat.
- "temperatura": "caliente" si dejó datos de contacto o quiere avanzar ya; "tibio" si mostró interés real y pidió precios pero no se comprometió; "frio" si solo curioseaba, preguntó algo suelto o se fue enseguida.
- "presupuesto_mencionado": el número que se manejó en la charla (lo que estimó el bot o lo que dijo el cliente que quiere gastar), como texto. null si no salió ningún número.
- "objeciones": dudas, quejas o frenos que planteó el visitante (precio, plazos, desconfianza). null si no hubo.
- "proximo_paso": la acción concreta que le conviene hacer al dueño, en una línea. Por ejemplo "Llamarlo y pasarle presupuesto por 3.5 ml en línea Estándar".
- Todo en castellano argentino.`

const CARD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  // En modo strict, OpenAI exige que TODAS las propiedades estén en `required`;
  // los campos opcionales se modelan como nullable, no omitiéndolos.
  required: [
    'nombre',
    'telefono',
    'email',
    'tipo_proyecto',
    'medidas',
    'linea_interes',
    'presupuesto_mencionado',
    'zona',
    'plazo',
    'temperatura',
    'resumen',
    'objeciones',
    'proximo_paso',
  ],
  properties: {
    nombre: { type: ['string', 'null'], description: 'Nombre del visitante si lo dijo' },
    telefono: { type: ['string', 'null'], description: 'Teléfono o WhatsApp que dejó' },
    email: { type: ['string', 'null'] },
    tipo_proyecto: {
      type: ['string', 'null'],
      description: 'Ej: cocina completa, mesada de granito, placard, vestidor, mueble de baño',
    },
    medidas: { type: ['string', 'null'], description: 'Ej: 3.5 metros lineales en L' },
    linea_interes: {
      type: ['string', 'null'],
      description: 'Económica, Estándar o Premium, si la mencionó',
    },
    presupuesto_mencionado: { type: ['string', 'null'] },
    zona: { type: ['string', 'null'], description: 'Barrio, ciudad o zona si la mencionó' },
    plazo: { type: ['string', 'null'], description: 'Cuándo lo necesita' },
    temperatura: { type: 'string', enum: ['caliente', 'tibio', 'frio'] },
    resumen: { type: 'string' },
    objeciones: { type: ['string', 'null'] },
    proximo_paso: { type: ['string', 'null'] },
  },
} as const

function normalize(value: unknown): ContactCard | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const raw = value as Record<string, unknown>

  const text = (key: string): string | null => {
    const v = raw[key]
    if (typeof v !== 'string') {
      return null
    }
    const trimmed = v.trim()
    // El modelo a veces devuelve "null"/"n/a" como texto en vez de null.
    if (!trimmed || /^(null|none|n\/?a|no menciona|sin datos)$/i.test(trimmed)) {
      return null
    }
    return trimmed.slice(0, 600)
  }

  const temperatura = raw.temperatura
  const resumen = text('resumen')
  if (!resumen) {
    return null
  }

  return {
    nombre: text('nombre'),
    telefono: text('telefono'),
    email: text('email'),
    tipo_proyecto: text('tipo_proyecto'),
    medidas: text('medidas'),
    linea_interes: text('linea_interes'),
    presupuesto_mencionado: text('presupuesto_mencionado'),
    zona: text('zona'),
    plazo: text('plazo'),
    temperatura:
      temperatura === 'caliente' || temperatura === 'tibio' || temperatura === 'frio'
        ? temperatura
        : 'frio',
    resumen,
    objeciones: text('objeciones'),
    proximo_paso: text('proximo_paso'),
  }
}

export async function generateCard(messages: MessageRow[]): Promise<ContactCard | null> {
  const apiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  if (!apiKey || messages.length === 0) {
    return null
  }

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'VISITANTE' : 'BOT'}: ${m.content}`)
    .join('\n')
    .slice(0, 20_000)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EXTRACTOR_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: EXTRACTOR_PROMPT },
        { role: 'user', content: `Conversación a analizar:\n\n${transcript}` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'tarjeta_contacto', strict: true, schema: CARD_SCHEMA },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    return null
  }

  try {
    return normalize(JSON.parse(content))
  } catch {
    return null
  }
}
