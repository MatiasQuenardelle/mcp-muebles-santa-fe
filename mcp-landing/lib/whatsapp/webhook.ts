// Lectura de los webhooks v2 de Kapso. Sin base ni red: se prueba directo con
// `npm test`. Docs: https://docs.kapso.ai/docs/platform/webhooks/overview.md

import { createHmac, timingSafeEqual } from 'node:crypto'

export const KAPSO_WEBHOOK_EVENTS = [
  'whatsapp.message.received',
  'whatsapp.message.sent',
  'whatsapp.message.delivered',
  'whatsapp.message.read',
  'whatsapp.message.failed',
] as const

export function iguales(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  return left.length === right.length && timingSafeEqual(left, right)
}

// Kapso firma los bytes crudos del cuerpo con HMAC-SHA256 en hexadecimal.
export function firmaValida(
  rawBody: string,
  secret: string | undefined,
  signature: string | null
): boolean {
  const clave = secret?.trim()
  if (!clave || !signature) {
    return false
  }
  const esperada = createHmac('sha256', clave).update(rawBody).digest('hex')
  return iguales(esperada, signature.trim().toLowerCase())
}

export interface EventoKapso {
  event: string | undefined
  payload: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function texto(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function anidado(record: Record<string, unknown> | null, ...path: string[]): string | undefined {
  let current: unknown = record
  for (const key of path) {
    const actual = asRecord(current)
    if (!actual) {
      return undefined
    }
    current = actual[key]
  }
  return texto(current)
}

function inferirEvento(payload: Record<string, unknown>): string | undefined {
  const kapso = asRecord(asRecord(payload.message)?.kapso)
  const direction = texto(kapso?.direction)
  const status = texto(kapso?.status)
  if (direction === 'inbound') {
    return 'whatsapp.message.received'
  }
  return direction === 'outbound' && status ? `whatsapp.message.${status}` : undefined
}

// Un request puede traer un evento o un lote (`{ type, batch: true, data: [...] }`).
export function separarEventos(body: unknown, eventHeader: string | null): EventoKapso[] {
  const record = asRecord(body)
  if (!record) {
    return []
  }

  if (record.batch === true && Array.isArray(record.data)) {
    const event = texto(record.type) ?? eventHeader ?? undefined
    return record.data
      .map(asRecord)
      .filter((item): item is Record<string, unknown> => item !== null)
      .map((payload) => ({ event: event ?? inferirEvento(payload), payload }))
  }

  const payload = asRecord(record.data) ?? record
  return [{ event: eventHeader ?? texto(record.event) ?? inferirEvento(payload), payload }]
}

export function soloDigitos(raw: string | undefined): string | undefined {
  const digits = raw?.replace(/\D/g, '')
  return digits || undefined
}

// `message.timestamp` son segundos Unix, como texto.
function fechaDeMensaje(raw: unknown): Date | undefined {
  const value = typeof raw === 'number' ? raw : Number(texto(raw))
  return Number.isFinite(value) && value > 0 ? new Date(value * 1000) : undefined
}

const ETIQUETAS_MEDIA: Record<string, string> = {
  image: '📷 Foto',
  video: '🎥 Video',
  document: '📄 Documento',
  audio: '🎤 Audio',
  sticker: 'Sticker',
}

/**
 * Kapso manda "[algo]" cuando no hay texto. Una foto de la cocina es parte de la
 * charla y tiene que verse; una reacción o un mensaje borrado no aportan nada.
 */
export function contenidoVisible(content: string, messageType: string | undefined): string | null {
  if (!/^\[.+\]$/.test(content.trim())) {
    return content
  }
  return ETIQUETAS_MEDIA[messageType ?? ''] ?? null
}

function contenidoDe(message: Record<string, unknown> | null): string | undefined {
  const kapso = asRecord(message?.kapso)
  const tipo = texto(message?.type)
  const transcripcion = anidado(kapso, 'transcript', 'text')
  const leyenda = tipo ? anidado(message, tipo, 'caption') : undefined

  if (tipo === 'audio' && transcripcion) {
    return transcripcion
  }
  if (tipo && leyenda && ETIQUETAS_MEDIA[tipo]) {
    return `${ETIQUETAS_MEDIA[tipo]}: ${leyenda}`
  }
  return (
    anidado(message, 'text', 'body') ??
    transcripcion ??
    texto(kapso?.content) ??
    (tipo ? `[${tipo}]` : undefined)
  )
}

export interface MensajeRecibido {
  phone: string
  content: string
  messageType?: string
  waMessageId: string
  phoneNumberId: string
  contactName?: string
  sentAt?: Date
}

export function leerMensajeRecibido(payload: Record<string, unknown>): MensajeRecibido | null {
  const message = asRecord(payload.message)
  const conversation = asRecord(payload.conversation)
  const kapso = asRecord(message?.kapso)

  const phone = soloDigitos(
    texto(conversation?.phone_number) ?? texto(message?.from) ?? texto(kapso?.phone_number)
  )
  const content = contenidoDe(message)
  const waMessageId = texto(message?.id)
  const phoneNumberId =
    texto(payload.phone_number_id) ??
    texto(conversation?.phone_number_id) ??
    texto(kapso?.phone_number_id)

  if (!phone || !content || !waMessageId || !phoneNumberId) {
    return null
  }

  return {
    phone,
    content,
    messageType: texto(message?.type),
    waMessageId,
    phoneNumberId,
    contactName: texto(conversation?.contact_name),
    sentAt: fechaDeMensaje(message?.timestamp),
  }
}

export interface EstadoDeMensaje {
  waMessageId: string
  phoneNumberId?: string
  phone?: string
  content?: string
  messageType?: string
  // 'cloud_api' para API y workflow; 'business_app' si contestaron desde el celular.
  origin?: string
  sentAt?: Date
}

export function leerEstado(payload: Record<string, unknown>): EstadoDeMensaje | null {
  const message = asRecord(payload.message)
  const conversation = asRecord(payload.conversation)
  const kapso = asRecord(message?.kapso)
  const waMessageId = texto(message?.id)
  if (!waMessageId) {
    return null
  }

  return {
    waMessageId,
    phoneNumberId: texto(payload.phone_number_id) ?? texto(conversation?.phone_number_id),
    phone: soloDigitos(texto(conversation?.phone_number) ?? texto(message?.to)),
    content: contenidoDe(message),
    messageType: texto(message?.type),
    origin: texto(kapso?.origin),
    sentAt: fechaDeMensaje(message?.timestamp),
  }
}
