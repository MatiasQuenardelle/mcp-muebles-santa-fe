// Server-only: lo que WhatsApp lee y escribe en la base del CRM.

import { SITE_ID, db, deleteDemoConversations } from '@/lib/db'
import type { ModoBot } from './modo'
import { mismoTelefono, telefonoCanonico } from './telefono'

export interface ConfigWhatsapp {
  mode: ModoBot
  phone_number_id: string | null
  workflow_id: string | null
}

export interface ContactoWhatsapp {
  id: string
  wa_phone: string
  ai_mode_override: ModoBot | null
}

export type EstadoMensaje = 'sent' | 'delivered' | 'read' | 'failed'

export async function leerConfig(): Promise<ConfigWhatsapp> {
  const sql = db()
  const rows = (await sql`
    select mode, phone_number_id, workflow_id from whatsapp_config where site_id = ${SITE_ID}
  `) as ConfigWhatsapp[]
  return rows[0] ?? { mode: 'OFF', phone_number_id: null, workflow_id: null }
}

export async function guardarModoGeneral(mode: ModoBot): Promise<void> {
  const sql = db()
  await sql`
    update whatsapp_config set mode = ${mode}, updated_at = now() where site_id = ${SITE_ID}
  `
}

// Devuelve false si ese evento ya se procesó.
export async function registrarEvento(id: string, event: string | null): Promise<boolean> {
  const sql = db()
  const rows = (await sql`
    insert into whatsapp_webhook_events (id, event) values (${id}, ${event})
    on conflict (id) do nothing
    returning id
  `) as unknown[]
  return rows.length > 0
}

// Si procesarlo falla, se libera para que el reintento de Kapso no se descarte.
export async function liberarEvento(id: string): Promise<void> {
  const sql = db()
  await sql`delete from whatsapp_webhook_events where id = ${id}`
}

/**
 * Un cliente que dejó su teléfono en la web o se cargó a mano sigue siendo el
 * mismo contacto cuando escribe por WhatsApp. El teléfono del CRM es texto libre:
 * la base trae candidatos por los últimos dígitos y acá se comparan bien.
 */
async function vincularContactoExistente(
  phone: string,
  name: string | undefined
): Promise<string | null> {
  const canonico = telefonoCanonico(phone)
  if (!canonico) {
    return null
  }
  const sql = db()
  // Seis: con un "15" en el medio y área de 3 o 4 dígitos, más dígitos ya lo incluirían.
  const terminacion = canonico.slice(-6)
  const candidatos = (await sql`
    select id, phone, card->>'telefono' as card_phone
    from conversations
    where site_id = ${SITE_ID}
      and wa_phone is null
      and not is_demo
      and (
        regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') like '%' || ${terminacion}
        or regexp_replace(coalesce(card->>'telefono', ''), '[^0-9]', '', 'g') like '%' || ${terminacion}
      )
    order by last_message_at desc
    limit 20
  `) as Array<{ id: string; phone: string | null; card_phone: string | null }>

  const contacto = candidatos.find(
    (item) => mismoTelefono(item.phone, canonico) || mismoTelefono(item.card_phone, canonico)
  )
  if (!contacto) {
    return null
  }

  await sql`
    update conversations
    set wa_phone = ${phone},
        phone = coalesce(phone, ${`+${phone}`}),
        name = coalesce(name, ${name ?? null})
    where id = ${contacto.id}::uuid
  `
  return contacto.id
}

export async function buscarOCrearContacto(
  phone: string,
  name: string | undefined
): Promise<ContactoWhatsapp> {
  const sql = db()
  const existente = (await sql`
    select id, wa_phone, ai_mode_override
    from conversations
    where site_id = ${SITE_ID} and wa_phone = ${phone}
  `) as ContactoWhatsapp[]
  if (existente[0]) {
    return existente[0]
  }

  const vinculado = await vincularContactoExistente(phone, name)
  if (vinculado) {
    const rows = (await sql`
      select id, wa_phone, ai_mode_override from conversations where id = ${vinculado}::uuid
    `) as ContactoWhatsapp[]
    return rows[0]
  }

  // El on conflict cubre dos mensajes simultáneos del mismo número nuevo.
  const creado = (await sql`
    insert into conversations (id, site_id, source, name, phone, wa_phone, message_count)
    values (
      ${crypto.randomUUID()}::uuid, ${SITE_ID}, 'whatsapp',
      ${name ?? null}, ${`+${phone}`}, ${phone}, 0
    )
    on conflict (site_id, wa_phone) where wa_phone is not null
      do update set wa_phone = excluded.wa_phone
    returning id, wa_phone, ai_mode_override, (xmax = 0) as nuevo
  `) as Array<ContactoWhatsapp & { nuevo: boolean }>

  if (creado[0].nuevo) {
    await deleteDemoConversations()
  }
  return creado[0]
}

export interface MensajeNuevo {
  conversationId: string
  role: 'user' | 'assistant' | 'human'
  content: string
  waMessageId: string
  status: EstadoMensaje | null
  messageType: string | null
  createdAt: Date
}

// Devuelve false si ese mensaje ya estaba guardado.
export async function guardarMensaje(input: MensajeNuevo): Promise<boolean> {
  const sql = db()
  const entrante = input.role === 'user'
  const rows = (await sql`
    with nuevo as (
      insert into messages (conversation_id, role, content, wa_message_id, status, message_type, created_at)
      values (
        ${input.conversationId}::uuid, ${input.role}, ${input.content}, ${input.waMessageId},
        ${input.status}, ${input.messageType}, ${input.createdAt.toISOString()}::timestamptz
      )
      on conflict (wa_message_id) where wa_message_id is not null do nothing
      returning created_at
    )
    update conversations c
    set message_count = c.message_count + 1,
        last_message_at = greatest(c.last_message_at, nuevo.created_at),
        last_inbound_at = case
          when ${entrante}::boolean then greatest(c.last_inbound_at, nuevo.created_at)
          else c.last_inbound_at
        end
    from nuevo
    where c.id = ${input.conversationId}::uuid
    returning c.id
  `) as unknown[]
  return rows.length > 0
}

/**
 * Lo que se manda desde el panel. El webhook de "enviado" puede ganarle a la
 * respuesta de Kapso y guardarlo como del bot: por eso, si ya existe, se corrige
 * el autor sin sumarlo dos veces. Quien lo envió ya lo leyó.
 */
export async function guardarMensajeDelPanel(input: {
  conversationId: string
  content: string
  waMessageId: string | null
}): Promise<void> {
  const sql = db()
  await sql`
    with guardado as (
      insert into messages (conversation_id, role, content, wa_message_id, status, message_type)
      values (${input.conversationId}::uuid, 'human', ${input.content}, ${input.waMessageId}, 'sent', 'text')
      on conflict (wa_message_id) where wa_message_id is not null
        do update set role = 'human'
      returning created_at, (xmax = 0) as nuevo
    )
    update conversations c
    set message_count = c.message_count + (case when guardado.nuevo then 1 else 0 end),
        last_message_at = greatest(c.last_message_at, guardado.created_at),
        last_read_at = now()
    from guardado
    where c.id = ${input.conversationId}::uuid
  `
}

// Los estados llegan desordenados: "leído" no puede volver a "entregado".
// Devuelve si el mensaje existe, aunque no haya cambiado.
export async function actualizarEstado(waMessageId: string, status: EstadoMensaje): Promise<boolean> {
  const sql = db()
  const rows = (await sql`
    with actual as (
      select id, status from messages where wa_message_id = ${waMessageId}
    ), cambio as (
      update messages m
      set status = ${status}
      from actual
      where m.id = actual.id
        and coalesce(array_position(array['sent', 'delivered', 'read', 'failed'], actual.status), 0)
          < array_position(array['sent', 'delivered', 'read', 'failed'], ${status}::text)
    )
    select count(*)::int as total from actual
  `) as Array<{ total: number }>
  return rows[0].total > 0
}

export async function guardarOverride(id: string, mode: ModoBot | null): Promise<void> {
  const sql = db()
  await sql`update conversations set ai_mode_override = ${mode} where id = ${id}::uuid`
}

export async function overrideDeTelefono(phone: string): Promise<ModoBot | null> {
  const sql = db()
  const rows = (await sql`
    select ai_mode_override from conversations where site_id = ${SITE_ID} and wa_phone = ${phone}
  `) as Array<{ ai_mode_override: ModoBot | null }>
  return rows[0]?.ai_mode_override ?? null
}

export async function contarEntrantesRecientes(id: string, segundos: number): Promise<number> {
  const sql = db()
  const rows = (await sql`
    select count(*)::int as total
    from messages
    where conversation_id = ${id}::uuid
      and role = 'user'
      and created_at > now() - make_interval(secs => ${segundos}::float8)
  `) as Array<{ total: number }>
  return rows[0].total
}

// Los que pueden tener una charla abierta en Kapso cuando cambia el modo general.
export async function contactosConCharlaReciente(): Promise<ContactoWhatsapp[]> {
  const sql = db()
  return (await sql`
    select id, wa_phone, ai_mode_override
    from conversations
    where site_id = ${SITE_ID}
      and wa_phone is not null
      and last_inbound_at > now() - interval '48 hours'
    order by last_inbound_at desc
    limit 40
  `) as ContactoWhatsapp[]
}

/**
 * Huella liviana de lo que cambió: si no se mueve, el panel no recarga nada.
 * Los estados de la charla abierta cuentan para que aparezca el tilde de leído.
 */
export async function huellaDelPanel(conversationId: string | null): Promise<string> {
  const sql = db()
  const rows = (await sql`
    select
      (select max(last_message_at) from conversations where site_id = ${SITE_ID}) as ultimo,
      (select coalesce(sum(array_position(array['sent', 'delivered', 'read', 'failed'], status)), 0)
         from messages where conversation_id = ${conversationId}::uuid) as estados,
      (select ai_mode_override from conversations where id = ${conversationId}::uuid) as override,
      (select mode from whatsapp_config where site_id = ${SITE_ID}) as general
  `) as Array<Record<string, unknown>>
  const { ultimo, estados, override, general } = rows[0]
  return [new Date(ultimo as string).getTime(), estados, override, general].join('|')
}
