// Server-only: qué hace el CRM con cada evento del webhook de Kapso.

import { addActivity } from '@/lib/db'
import { pausarPorIntervencionHumana } from './control'
import {
  actualizarEstado,
  buscarOCrearContacto,
  contarEntrantesRecientes,
  guardarMensaje,
  guardarOverride,
  leerConfig,
  type EstadoMensaje,
} from './db'
import { terminarConversacion } from './kapso'
import { BUCLE_VENTANA_SEGUNDOS, hayBucle } from './modo'
import {
  contenidoVisible,
  leerEstado,
  leerMensajeRecibido,
  type EstadoDeMensaje,
  type EventoKapso,
  type MensajeRecibido,
} from './webhook'

const ESTADO_POR_EVENTO: Record<string, EstadoMensaje> = {
  'whatsapp.message.sent': 'sent',
  'whatsapp.message.delivered': 'delivered',
  'whatsapp.message.read': 'read',
  'whatsapp.message.failed': 'failed',
}

async function procesarRecibido(dato: MensajeRecibido): Promise<void> {
  const content = contenidoVisible(dato.content, dato.messageType)
  if (!content) {
    return
  }

  const contacto = await buscarOCrearContacto(dato.phone, dato.contactName)
  const guardado = await guardarMensaje({
    conversationId: contacto.id,
    role: 'user',
    content,
    waMessageId: dato.waMessageId,
    status: null,
    messageType: dato.messageType ?? null,
    createdAt: dato.sentAt ?? new Date(),
  })
  if (guardado && contacto.ai_mode_override !== 'OFF') {
    await cortarSiHayBucle(dato, contacto.id)
  }
}

async function cortarSiHayBucle(dato: MensajeRecibido, id: string): Promise<void> {
  if (!hayBucle(await contarEntrantesRecientes(id, BUCLE_VENTANA_SEGUNDOS))) {
    return
  }
  await guardarOverride(id, 'OFF')
  await addActivity(id, 'nota', 'El bot se apagó con este contacto: parecía otro bot en bucle.', null)
  try {
    await terminarConversacion(dato.phoneNumberId, dato.phone)
  } catch (error) {
    console.error('[whatsapp] No se pudo cerrar la charla en bucle', error)
  }
}

async function procesarEstado(dato: EstadoDeMensaje, status: EstadoMensaje): Promise<void> {
  if (await actualizarEstado(dato.waMessageId, status)) {
    return
  }
  // No salió del panel: lo mandó el bot o una persona desde el celular.
  if (!dato.phone || !dato.content) {
    return
  }

  const humano = dato.origin === 'business_app'
  const contacto = await buscarOCrearContacto(dato.phone, undefined)
  const guardado = await guardarMensaje({
    conversationId: contacto.id,
    role: humano ? 'human' : 'assistant',
    content: dato.content,
    waMessageId: dato.waMessageId,
    status,
    messageType: dato.messageType ?? null,
    createdAt: dato.sentAt ?? new Date(),
  })
  if (guardado && humano) {
    await pausarPorIntervencionHumana(contacto)
  }
}

export async function procesarEvento({ event, payload }: EventoKapso): Promise<void> {
  const config = await leerConfig()

  // El número viene firmado: lo que sea de otro número no es de este negocio.
  const esDelNegocio = (phoneNumberId: string | undefined) =>
    Boolean(config.phone_number_id) && phoneNumberId === config.phone_number_id

  if (event === 'whatsapp.message.received') {
    const dato = leerMensajeRecibido(payload)
    if (dato && esDelNegocio(dato.phoneNumberId)) {
      await procesarRecibido(dato)
    }
    return
  }

  const status = event ? ESTADO_POR_EVENTO[event] : undefined
  if (status) {
    const dato = leerEstado(payload)
    if (dato && esDelNegocio(dato.phoneNumberId)) {
      await procesarEstado(dato, status)
    }
  }
}
