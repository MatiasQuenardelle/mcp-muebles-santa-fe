// Server-only: acceso a la base del CRM (Neon Postgres vía driver HTTP).
// No importar desde componentes cliente ni desde middleware.ts (corre en Edge).

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import type { ContactCard, ConversationFilter, ConversationStatus } from '@/lib/crm'

export type { ContactCard, ConversationFilter, ConversationStatus }

// El sitio dueño de los datos. Fijo por ahora, pero está en cada tabla para
// poder reusar este mismo esquema en otro cliente sin migrar nada.
export const SITE_ID = 'mcp'

// Límites de escritura. El tope del cliente (ChatWidget) es cosmético: cualquiera
// puede postear a /api/chat directo, así que el corte real se hace acá.
export const MAX_MESSAGES_PER_CONVERSATION = 60
export const MAX_NEW_CONVERSATIONS_PER_HOUR = 12

export interface ConversationRow {
  id: string
  started_at: string
  last_message_at: string
  message_count: number
  page: string | null
  attribution: Record<string, unknown> | null
  name: string | null
  phone: string | null
  went_to_whatsapp: boolean
  status: ConversationStatus
  notes: string | null
  card: ContactCard | null
  card_generated_at: string | null
  card_message_count: number | null
  // Derivado en el select: hay mensajes posteriores a la última vez que se abrió
  // la conversación en el panel.
  unread: boolean
  is_demo: boolean
}

export interface MessageRow {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

let client: NeonQueryFunction<false, false> | null = null

// Perezoso a propósito: instanciarlo en el top level tira si falta DATABASE_URL,
// y eso rompe `next build` al recolectar las rutas.
function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = (process.env.DATABASE_URL ?? '').trim()
    if (!url) {
      throw new Error('DATABASE_URL no está configurada')
    }
    client = neon(url)
  }
  return client
}

export function isDatabaseConfigured(): boolean {
  return Boolean((process.env.DATABASE_URL ?? '').trim())
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// La IP sola se revierte por fuerza bruta en segundos (son 2^32 valores),
// así que se saltea antes de hashear.
export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) {
    return null
  }
  const salt = (process.env.IP_HASH_SALT ?? '').trim()
  return sha256Hex(`${ip}:${salt}`)
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim() || null
  }
  return request.headers.get('x-real-ip')
}

// ---------------------------------------------------------------------------
// Escritura desde el chat público
// ---------------------------------------------------------------------------

interface RecordTurnInput {
  conversationId: string
  page: string | null
  attribution: unknown
  userAgent: string | null
  ipHash: string | null
  role: 'user' | 'assistant'
  content: string
}

/**
 * Crea la conversación si no existe y le agrega un mensaje. Las dos sentencias
 * viajan en un solo request HTTP (`transaction` del driver es un batch), y en
 * ese orden porque messages tiene FK contra conversations.
 *
 * Devuelve el message_count resultante para poder cortar la charla del lado del
 * servidor. page/attribution/user_agent solo se escriben en el INSERT: en los
 * mensajes siguientes se conserva el contexto original de entrada del visitante.
 */
export async function recordTurn(input: RecordTurnInput): Promise<number> {
  const sql = db()
  const [upserted] = (await sql.transaction([
    sql`
      insert into conversations (id, site_id, page, attribution, user_agent, ip_hash, message_count)
      values (
        ${input.conversationId}::uuid,
        ${SITE_ID},
        ${input.page},
        ${input.attribution ? JSON.stringify(input.attribution) : null}::jsonb,
        ${input.userAgent},
        ${input.ipHash},
        1
      )
      on conflict (id) do update
        set last_message_at = now(),
            message_count = conversations.message_count + 1
      returning message_count
    `,
    sql`
      insert into messages (conversation_id, role, content)
      values (${input.conversationId}::uuid, ${input.role}, ${input.content})
    `,
  ])) as [Array<{ message_count: number }>, unknown]

  const messageCount = upserted[0]?.message_count ?? 0

  // message_count === 1 solo se da en el INSERT, o sea al crear una conversación
  // nueva: ese es el momento exacto en que el ejemplo del panel deja de hacer
  // falta. Se chequea acá y no en cada turno para no pagar un DELETE por mensaje.
  if (messageCount === 1) {
    await deleteDemoConversations()
  }

  return messageCount
}

// Los mensajes de la demo se van solos por el `on delete cascade` de la FK.
export async function deleteDemoConversations(): Promise<void> {
  const sql = db()
  await sql`delete from conversations where site_id = ${SITE_ID} and is_demo`
}

export async function countRecentConversations(ipHash: string): Promise<number> {
  const sql = db()
  const rows = (await sql`
    select count(*)::int as total
    from conversations
    where ip_hash = ${ipHash}
      and started_at > now() - interval '1 hour'
  `) as Array<{ total: number }>
  return rows[0]?.total ?? 0
}

export async function getMessageCount(conversationId: string): Promise<number | null> {
  const sql = db()
  const rows = (await sql`
    select message_count from conversations where id = ${conversationId}::uuid
  `) as Array<{ message_count: number }>
  return rows.length ? rows[0].message_count : null
}

export async function saveLead(input: {
  conversationId: string | null
  source: string
  page: string | null
  name: string | null
  phone: string | null
  message: string | null
  attribution: unknown
  userAgent: string | null
}): Promise<void> {
  const sql = db()
  // La FK apunta a conversations: si la cookie trae un id que no existe (o ya
  // se borró), se guarda el lead igual sin conversación asociada.
  const conversationId = input.conversationId
    ? ((
        (await sql`select id from conversations where id = ${input.conversationId}::uuid`) as Array<{
          id: string
        }>
      )[0]?.id ?? null)
    : null

  await sql`
    insert into leads (site_id, conversation_id, source, page, name, phone, message, attribution, user_agent)
    values (
      ${SITE_ID}, ${conversationId}::uuid, ${input.source}, ${input.page}, ${input.name},
      ${input.phone}, ${input.message},
      ${input.attribution ? JSON.stringify(input.attribution) : null}::jsonb,
      ${input.userAgent}
    )
  `

  if (conversationId) {
    await sql`
      update conversations
      set phone = coalesce(${input.phone}, phone),
          name = coalesce(${input.name}, name),
          went_to_whatsapp = went_to_whatsapp or ${input.source.startsWith('whatsapp')}
      where id = ${conversationId}::uuid
    `
  }
}

// ---------------------------------------------------------------------------
// Lectura y gestión desde el panel
// ---------------------------------------------------------------------------

/**
 * Lista para el panel. Búsqueda y filtro van en la misma query: el driver HTTP
 * de Neon usa tagged templates y no deja componer el WHERE por partes, así que
 * cada condición se activa desde su propio parámetro (sigue siendo parametrizada,
 * no hay concatenación de strings).
 */
export async function listConversations(options?: {
  search?: string
  filter?: ConversationFilter
}): Promise<ConversationRow[]> {
  const sql = db()
  const term = (options?.search ?? '').trim()
  const like = `%${term}%`
  const filter = options?.filter ?? 'todas'

  // Se ignoran las conversaciones de un solo mensaje sin teléfono: son rebotes.
  const rows = await sql`
    select id, started_at, last_message_at, message_count, page, attribution,
           name, phone, went_to_whatsapp, status, notes,
           card, card_generated_at, card_message_count, is_demo,
           (last_message_at > coalesce(last_read_at, 'epoch'::timestamptz)) as unread
    from conversations
    where site_id = ${SITE_ID}
      and (message_count > 1 or phone is not null)
      and (
        ${term} = ''
        or phone ilike ${like}
        or name ilike ${like}
        or card->>'nombre' ilike ${like}
        or card->>'telefono' ilike ${like}
        or card->>'resumen' ilike ${like}
      )
      and (
        ${filter} = 'todas'
        or (${filter} = 'no_leidas' and last_message_at > coalesce(last_read_at, 'epoch'::timestamptz))
        or (${filter} = 'pendientes' and status = 'nuevo')
        or (${filter} = 'calientes' and card->>'temperatura' = 'caliente')
        or (${filter} = 'con_telefono' and (phone is not null or card->>'telefono' is not null))
      )
    order by last_message_at desc
    limit 200
  `

  return rows as unknown as ConversationRow[]
}

export async function getConversation(id: string): Promise<ConversationRow | null> {
  const sql = db()
  const rows = (await sql`
    select id, started_at, last_message_at, message_count, page, attribution,
           name, phone, went_to_whatsapp, status, notes,
           card, card_generated_at, card_message_count, is_demo,
           (last_message_at > coalesce(last_read_at, 'epoch'::timestamptz)) as unread
    from conversations
    where id = ${id}::uuid and site_id = ${SITE_ID}
  `) as unknown as ConversationRow[]
  return rows[0] ?? null
}

// Se llama al abrir la conversación en el panel. Es idempotente: siempre pisa
// last_read_at con now(), así que reabrirla no reintroduce el "no leída".
export async function markConversationRead(id: string): Promise<void> {
  const sql = db()
  await sql`update conversations set last_read_at = now() where id = ${id}::uuid`
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const sql = db()
  const rows = (await sql`
    select role, content, created_at
    from messages
    where conversation_id = ${conversationId}::uuid
    order by id asc
  `) as unknown as MessageRow[]
  return rows
}

export async function updateConversation(
  id: string,
  fields: { status?: ConversationStatus; notes?: string }
): Promise<void> {
  const sql = db()
  if (fields.status !== undefined) {
    await sql`update conversations set status = ${fields.status} where id = ${id}::uuid`
  }
  if (fields.notes !== undefined) {
    await sql`update conversations set notes = ${fields.notes} where id = ${id}::uuid`
  }
}

export interface DashboardStats {
  sin_contactar: number
  hoy: number
  whatsapp_hoy: number
  ganados: number
}

// Métricas pensadas para decidir qué hacer, no para describir: lo primero que
// tiene que ver el dueño es cuántas consultas le quedan sin contestar.
export async function getStats(): Promise<DashboardStats> {
  const sql = db()
  const rows = (await sql`
    select
      count(*) filter (where status = 'nuevo')::int as sin_contactar,
      count(*) filter (
        where started_at >= date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
              at time zone 'America/Argentina/Buenos_Aires'
      )::int as hoy,
      (
        select count(*)::int from leads
        where site_id = ${SITE_ID}
          and source like 'whatsapp:%'
          and created_at >= date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
              at time zone 'America/Argentina/Buenos_Aires'
      ) as whatsapp_hoy,
      count(*) filter (where status = 'ganado')::int as ganados
    from conversations
    where site_id = ${SITE_ID} and (message_count > 1 or phone is not null)
  `) as unknown as DashboardStats[]

  return rows[0] ?? { sin_contactar: 0, hoy: 0, whatsapp_hoy: 0, ganados: 0 }
}

export interface WhatsAppClickRow {
  id: number
  created_at: string
  page: string | null
  source: string
  attribution: Record<string, unknown> | null
}

/**
 * Clics a los CTA de WhatsApp del sitio público. No pasan por el chatbot, así
 * que no tienen conversación ni nombre: lo único que aportan es de dónde vino
 * la persona, para poder cruzarlo por hora con el mensaje que le llega al
 * WhatsApp del dueño.
 */
export async function listWhatsAppClicks(limit = 100): Promise<WhatsAppClickRow[]> {
  const sql = db()
  const rows = (await sql`
    select id, created_at, page, source, attribution
    from leads
    where site_id = ${SITE_ID} and source like 'whatsapp:%'
    order by created_at desc
    limit ${limit}
  `) as unknown as WhatsAppClickRow[]
  return rows
}

// ---------------------------------------------------------------------------
// Cola de tarjetas de contacto
// ---------------------------------------------------------------------------

/**
 * Reclama de forma atómica hasta `limit` conversaciones que necesitan tarjeta.
 * El driver HTTP no soporta `select ... for update`, así que el lock se hace
 * con un UPDATE ... RETURNING sobre card_claimed_at: dos requests simultáneos
 * no pueden llevarse la misma fila.
 *
 * Una tarjeta se genera cuando la charla lleva 20 minutos quieta (se asume
 * terminada) y no tiene tarjeta, o la tuvo pero después llegaron más mensajes.
 */
export async function claimConversationsForCard(limit: number): Promise<string[]> {
  const sql = db()
  const rows = (await sql`
    update conversations
    set card_claimed_at = now()
    where id in (
      select id from conversations
      where site_id = ${SITE_ID}
        and last_message_at < now() - interval '20 minutes'
        and message_count > 1
        and (card is null or coalesce(card_message_count, 0) < message_count)
        and (card_claimed_at is null or card_claimed_at < now() - interval '3 minutes')
      order by last_message_at desc
      limit ${limit}
    )
    returning id
  `) as Array<{ id: string }>
  return rows.map((r) => r.id)
}

export async function countPendingCards(): Promise<number> {
  const sql = db()
  const rows = (await sql`
    select count(*)::int as total
    from conversations
    where site_id = ${SITE_ID}
      and last_message_at < now() - interval '20 minutes'
      and message_count > 1
      and (card is null or coalesce(card_message_count, 0) < message_count)
      and (card_claimed_at is null or card_claimed_at < now() - interval '3 minutes')
  `) as Array<{ total: number }>
  return rows[0]?.total ?? 0
}

export async function saveCard(
  conversationId: string,
  card: ContactCard,
  messageCount: number
): Promise<void> {
  const sql = db()
  await sql`
    update conversations
    set card = ${JSON.stringify(card)}::jsonb,
        card_generated_at = now(),
        card_message_count = ${messageCount},
        card_claimed_at = null,
        name = coalesce(name, ${card.nombre}),
        phone = coalesce(phone, ${card.telefono})
    where id = ${conversationId}::uuid
  `
}

/**
 * Marca la conversación como "ya avisada" y devuelve true solo la primera vez.
 * El `where hot_notified_at is null` hace de lock: si dos ticks generan la
 * tarjeta a la vez, uno solo se lleva la fila y se manda un único aviso.
 */
export async function claimHotNotification(conversationId: string): Promise<boolean> {
  const sql = db()
  const rows = (await sql`
    update conversations
    set hot_notified_at = now()
    where id = ${conversationId}::uuid and hot_notified_at is null
    returning id
  `) as Array<{ id: string }>
  return rows.length > 0
}

// Deshace el claim cuando el webhook falló, para que "Regenerar resumen" pueda
// reintentar el aviso en vez de perderlo para siempre.
export async function releaseHotNotification(conversationId: string): Promise<void> {
  const sql = db()
  await sql`
    update conversations set hot_notified_at = null where id = ${conversationId}::uuid
  `
}

// Libera el lock sin marcar la tarjeta como hecha, para que se reintente.
export async function releaseCardClaim(conversationId: string): Promise<void> {
  const sql = db()
  await sql`
    update conversations set card_claimed_at = null where id = ${conversationId}::uuid
  `
}

// Fuerza la regeneración de una tarjeta desde el panel.
export async function invalidateCard(conversationId: string): Promise<void> {
  const sql = db()
  await sql`
    update conversations
    set card_message_count = null, card_claimed_at = null
    where id = ${conversationId}::uuid
  `
}
