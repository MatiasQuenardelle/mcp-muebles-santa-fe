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
--   kind: nota | llamada | whatsapp | visita | presupuesto | estado | alta | asignacion
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

-- Acceso al panel (2026-10-21). Reemplaza a la contraseña única compartida:
-- cada persona tiene su cuenta, entra por un link de invitación de un solo uso
-- y elige su propia contraseña. Ver lib/session.ts.
create table if not exists admin_users (
  id               uuid        primary key,
  -- Siempre en minúsculas: el login compara contra esto.
  email            text        not null unique,
  name             text        not null,
  -- owner: además del CRM, administra usuarios. user: solo el CRM.
  role             text        not null default 'user' check (role in ('owner', 'user')),
  -- scrypt (lib/password.ts). Null hasta que la persona acepta la invitación.
  password_hash    text,
  -- Secreto TOTP cifrado con AES-GCM (lib/totp.ts). Se guarda al empezar a
  -- configurarlo; recién vale cuando totp_enabled = true.
  totp_secret      text,
  totp_enabled     boolean     not null default false,
  active           boolean     not null default true,
  created_at       timestamptz not null default now(),
  last_login_at    timestamptz
);

-- Se guarda el SHA-256 del token, nunca el token: con un volcado de la base no
-- alcanza para entrar.
create table if not exists admin_sessions (
  token_hash   text        primary key,
  user_id      uuid        not null references admin_users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  user_agent   text
);

create index if not exists admin_sessions_user_idx on admin_sessions (user_id);

-- Links de alta y de "restablecer contraseña". Un solo uso, vencen a las 48 h.
create table if not exists admin_invites (
  token_hash   text        primary key,
  user_id      uuid        not null references admin_users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  used_at      timestamptz
);

-- Intentos fallidos de login, para frenar la fuerza bruta. key es
-- 'email:<email>' o 'ip:<hash>'.
create table if not exists admin_login_failures (
  id          bigserial   primary key,
  key         text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists admin_login_failures_key_idx
  on admin_login_failures (key, created_at desc);

-- Quién registró cada entrada del historial.
alter table activities add column if not exists user_id uuid references admin_users(id) on delete set null;

-- Responsable del contacto (2026-10-22). Un usuario 'user' ve solo los suyos y
-- los sin asignar (para poder tomarlos); el dueño ve todo y reparte. Los chats
-- de la web entran sin asignar. Si se borra el usuario, el contacto vuelve al pozo.
alter table conversations add column if not exists assigned_to uuid references admin_users(id) on delete set null;

create index if not exists conversations_assigned_idx
  on conversations (assigned_to)
  where assigned_to is not null;

-- Presupuestos (2026-10-28). 'formal' lo arma el dueño desde la ficha del
-- contacto (las cuatro fases de la planilla de Marcelo); 'preliminar' lo genera
-- un visitante desde la calculadora de /cocinas. `data` es PresupuestoData o
-- PreliminarData (lib/presupuesto.ts); `total` se guarda aparte para listar.
create sequence if not exists presupuesto_numero_seq;

create table if not exists presupuestos (
  id               uuid          primary key,
  conversation_id  uuid          not null references conversations(id) on delete cascade,
  numero           text          not null,
  kind             text          not null default 'formal' check (kind in ('formal', 'preliminar')),
  data             jsonb         not null,
  total            numeric(14,2) not null,
  sent_at          timestamptz,
  created_by       uuid          references admin_users(id) on delete set null,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

create index if not exists presupuestos_conversation_idx
  on presupuestos (conversation_id, created_at desc);

-- Para copiar los precios del último presupuesto formal al armar uno nuevo.
create index if not exists presupuestos_formal_recent_idx
  on presupuestos (created_at desc)
  where kind = 'formal';
