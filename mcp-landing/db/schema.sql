-- Esquema del CRM del chatbot. Aplicado en Neon (proyecto mcp-muebles).
-- Se mantiene acá versionado para poder recrear la base o portarla a otro cliente.

create table if not exists conversations (
  id                 uuid primary key,
  -- Permite reusar el mismo esquema para otros sitios sin migrar nada.
  site_id            text        not null default 'mcp',
  started_at         timestamptz not null default now(),
  last_message_at    timestamptz not null default now(),
  message_count      int         not null default 0,
  page               text,
  attribution        jsonb,
  user_agent         text,
  -- SHA-256 de (ip + IP_HASH_SALT): sirve para limitar abuso sin guardar la IP.
  ip_hash            text,
  name               text,
  phone              text,
  went_to_whatsapp   boolean     not null default false,
  -- Gestión comercial: nuevo | contactado | presupuestado | ganado | perdido
  status             text        not null default 'nuevo',
  notes              text,
  -- Tarjeta de contacto generada por el extractor (lib/card.ts).
  card               jsonb,
  card_generated_at  timestamptz,
  -- Si card_message_count < message_count, la charla siguió y la tarjeta quedó vieja.
  card_message_count int,
  -- Lock optimista: evita que dos requests generen la misma tarjeta a la vez.
  card_claimed_at    timestamptz,
  -- Cuándo se avisó de este lead (Telegram al dejar el teléfono, o webhook al
  -- salir la tarjeta caliente). Se setea una sola vez: hace de lock para no
  -- mandar el mismo lead dos veces por dos caminos distintos.
  hot_notified_at    timestamptz,
  -- Última vez que se abrió la conversación en el panel. Está no leída cuando
  -- last_message_at > last_read_at. En la base y no en localStorage para que el
  -- estado sea el mismo desde la compu y desde el celular.
  last_read_at       timestamptz,
  -- Conversación de ejemplo, para que el panel no arranque vacío y se entienda
  -- qué va a mostrar. Se marca a mano; recordTurn nunca la setea, y la borra en
  -- cuanto entra la primera conversación de verdad.
  is_demo            boolean     not null default false
);

create table if not exists messages (
  id              bigserial primary key,
  conversation_id uuid        not null references conversations(id) on delete cascade,
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  created_at      timestamptz not null default now()
);

-- Espejo del record que ya arma app/api/lead/route.ts (clics a WhatsApp y
-- teléfonos detectados en el chat), para que nada quede solo en los logs.
create table if not exists leads (
  id              bigserial primary key,
  site_id         text        not null default 'mcp',
  conversation_id uuid        references conversations(id) on delete set null,
  source          text        not null default 'unknown',
  page            text,
  name            text,
  phone           text,
  message         text,
  attribution     jsonb,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- Migraciones sobre bases que ya existían (create table if not exists no agrega
-- columnas nuevas). Repetirlas es inofensivo.
alter table conversations add column if not exists hot_notified_at timestamptz;
alter table conversations add column if not exists last_read_at timestamptz;
alter table conversations add column if not exists is_demo boolean not null default false;

-- CRM (2026-10-21). Una fila de conversations es un contacto/oportunidad: la
-- mayoría nace de un chat del asistente, pero también se cargan a mano los que
-- llegan por WhatsApp directo, Instagram, teléfono o el local (source <> 'chat',
-- message_count = 0). Los datos editados a mano pisan a los de la tarjeta IA.
--   source: chat | whatsapp | instagram | facebook | telefono | local | referido | otro
alter table conversations add column if not exists source text not null default 'chat';
alter table conversations add column if not exists email text;
alter table conversations add column if not exists zona text;
alter table conversations add column if not exists project text;
-- Monto presupuestado o vendido, en pesos.
alter table conversations add column if not exists amount numeric(14, 2);
-- Fecha (sin hora) del próximo contacto. Date y no timestamptz para que "hoy"
-- y "vencido" no dependan de la zona horaria de quien mira.
alter table conversations add column if not exists follow_up_on date;
alter table conversations add column if not exists follow_up_note text;
alter table conversations add column if not exists lost_reason text;
alter table conversations add column if not exists status_changed_at timestamptz;

-- Historial de lo que se hizo con cada contacto. Los cambios de estado se
-- registran solos; el resto lo carga el dueño desde el panel.
--   kind: nota | llamada | whatsapp | visita | presupuesto | estado | alta
create table if not exists activities (
  id              bigserial primary key,
  conversation_id uuid        not null references conversations(id) on delete cascade,
  kind            text        not null,
  body            text,
  created_at      timestamptz not null default now()
);

create index if not exists activities_conversation_idx
  on activities (conversation_id, created_at desc);

create index if not exists conversations_follow_up_idx
  on conversations (site_id, follow_up_on)
  where follow_up_on is not null;

create index if not exists conversations_recent_idx
  on conversations (site_id, last_message_at desc);

-- Cola de tarjetas pendientes: el tick escanea por last_message_at.
create index if not exists conversations_pending_card_idx
  on conversations (last_message_at)
  where card is null;

create index if not exists messages_conversation_idx
  on messages (conversation_id, id);

create index if not exists leads_recent_idx
  on leads (site_id, created_at desc);
