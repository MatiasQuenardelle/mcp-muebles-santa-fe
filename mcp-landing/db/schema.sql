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
  -- Cuándo se avisó por webhook que el lead salió caliente. Se setea una sola
  -- vez: regenerar la tarjeta no vuelve a notificar.
  hot_notified_at    timestamptz
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
