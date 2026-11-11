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

-- ---------------------------------------------------------------------------
-- Gestión de la empresa (2026-11). Obras, plata, compras y equipo.
--
-- `movimientos` es el único libro de caja: un cobro, un pago a proveedor, una
-- comisión o la luz de casa son filas de la misma tabla. Las reglas de cuánto se
-- debe y cuánto se ganó están en lib/gestion/calculos.ts y una sola vez.
--
-- Los check van dentro del create table a propósito: `add constraint` no admite
-- `if not exists` y este archivo se vuelve a aplicar en cada migración.
-- ---------------------------------------------------------------------------

-- Todas las personas de la empresa, tengan o no cuenta en el panel.
create table if not exists personal (
  id            uuid          primary key default gen_random_uuid(),
  nombre        text          not null,
  puesto        text,
  telefono      text,
  user_id       uuid          unique references admin_users(id) on delete set null,
  comision_pct  numeric(5,2)  not null default 0 check (comision_pct between 0 and 100),
  activo        boolean       not null default true,
  created_at    timestamptz   not null default now()
);

create table if not exists proveedores (
  id             uuid          primary key default gen_random_uuid(),
  nombre         text          not null,
  telefono       text,
  cuit           text,
  rubro          text,
  -- Lo que ya se le debía el día que se empezó a usar el panel.
  saldo_inicial  numeric(14,2) not null default 0,
  activo         boolean       not null default true,
  created_at     timestamptz   not null default now()
);

create table if not exists cuentas (
  id             uuid          primary key default gen_random_uuid(),
  nombre         text          not null unique,
  tipo           text          not null check (tipo in ('efectivo', 'banco', 'billetera')),
  saldo_inicial  numeric(14,2) not null default 0,
  activa         boolean       not null default true,
  created_at     timestamptz   not null default now()
);

-- `grupo` no se puede cambiar una vez creada: cambiarlo reescribiría la ganancia
-- de los meses pasados. `clave` marca las categorías con reglas propias.
create table if not exists categorias (
  id          uuid        primary key default gen_random_uuid(),
  nombre      text        not null,
  grupo       text        not null check (grupo in ('ingreso', 'negocio', 'familia')),
  clave       text        unique check (clave in (
                'cobro_obra', 'devolucion_cliente', 'pago_proveedor', 'devolucion_proveedor', 'comision'
              )),
  activa      boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (grupo, nombre)
);

create table if not exists gastos_fijos (
  id            uuid          primary key default gen_random_uuid(),
  nombre        text          not null,
  categoria_id  uuid          not null references categorias(id) on delete restrict,
  monto         numeric(14,2) not null check (monto > 0),
  frecuencia    text          not null check (frecuencia in ('semanal', 'mensual')),
  activo        boolean       not null default true,
  created_at    timestamptz   not null default now()
);

create sequence if not exists obra_numero_seq;

create table if not exists obras (
  id               uuid          primary key default gen_random_uuid(),
  numero           text          not null unique,
  conversation_id  uuid          references conversations(id) on delete set null,
  presupuesto_id   uuid          references presupuestos(id) on delete set null,
  -- Copias: la obra sigue teniendo cliente aunque se borre el contacto.
  cliente          text          not null,
  telefono         text,
  titulo           text          not null,
  zona             text,
  etapa            text          not null default 'medicion' check (etapa in (
                     'medicion', 'diseno', 'materiales', 'corte', 'armado', 'colocacion'
                   )),
  -- Contrato original. Nunca se pisa: los cambios van a obra_ajustes.
  total            numeric(14,2) not null check (total >= 0),
  -- Lo cobrado antes de empezar a usar el panel.
  cobrado_inicial  numeric(14,2) not null default 0 check (cobrado_inicial >= 0),
  fecha_venta      date          not null,
  fecha_entrega    date,
  entregada_en     date,
  cancelada_en     date,
  vendedor_id      uuid          references personal(id) on delete set null,
  comision_pct     numeric(5,2)  not null default 0 check (comision_pct between 0 and 100),
  notas            text,
  creado_por       uuid          references admin_users(id) on delete set null,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- Un presupuesto se vende una sola vez, salvo que esa venta se haya caído.
create unique index if not exists obras_presupuesto_uq
  on obras (presupuesto_id)
  where presupuesto_id is not null and cancelada_en is null;

create index if not exists obras_conversation_idx
  on obras (conversation_id)
  where conversation_id is not null;

create index if not exists obras_en_curso_idx
  on obras (fecha_entrega)
  where entregada_en is null and cancelada_en is null;

-- Adicionales y descuentos después de la venta, con su fecha y su motivo.
create table if not exists obra_ajustes (
  id          uuid          primary key default gen_random_uuid(),
  obra_id     uuid          not null references obras(id) on delete cascade,
  fecha       date          not null,
  monto       numeric(14,2) not null check (monto <> 0),
  motivo      text          not null,
  creado_por  uuid          references admin_users(id) on delete set null,
  created_at  timestamptz   not null default now()
);

create index if not exists obra_ajustes_obra_idx on obra_ajustes (obra_id);

-- Plan de pagos congelado al vender. Solo para mostrar: lo que se debe de verdad
-- sale de totalVigente - cobradoNeto (lib/gestion/calculos.ts).
create table if not exists obra_cuotas (
  id              uuid          primary key default gen_random_uuid(),
  obra_id         uuid          not null references obras(id) on delete cascade,
  orden           int           not null,
  concepto        text          not null,
  monto           numeric(14,2) not null check (monto >= 0),
  -- A partir de qué etapa se le puede reclamar al cliente. Null = desde el inicio.
  etapa_exigible  text          check (etapa_exigible in (
                    'medicion', 'diseno', 'materiales', 'corte', 'armado', 'colocacion'
                  )),
  unique (obra_id, orden)
);

create table if not exists obra_eventos (
  id               uuid        primary key default gen_random_uuid(),
  obra_id          uuid        not null references obras(id) on delete cascade,
  etapa_anterior   text,
  etapa            text        not null,
  nota             text,
  user_id          uuid        references admin_users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists obra_eventos_obra_idx on obra_eventos (obra_id, created_at desc);

create table if not exists compras (
  id            uuid        primary key default gen_random_uuid(),
  proveedor_id  uuid        not null references proveedores(id) on delete restrict,
  fecha         date        not null,
  comprobante   text,
  estado        text        not null default 'pedido' check (estado in ('pedido', 'recibido', 'cancelado')),
  recibida_en   date,
  vence_el      date,
  nota          text,
  creado_por    uuid        references admin_users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists compras_proveedor_idx on compras (proveedor_id, fecha);

-- La obra va por renglón: diez placas pueden repartirse entre dos cocinas.
create table if not exists compra_items (
  id           uuid          primary key default gen_random_uuid(),
  compra_id    uuid          not null references compras(id) on delete cascade,
  descripcion  text          not null,
  cantidad     numeric(12,3) not null check (cantidad > 0),
  precio       numeric(14,2) not null check (precio >= 0),
  obra_id      uuid          references obras(id) on delete restrict
);

create index if not exists compra_items_compra_idx on compra_items (compra_id);
create index if not exists compra_items_obra_idx on compra_items (obra_id) where obra_id is not null;

create table if not exists movimientos (
  -- Lo genera el navegador: si el usuario toca dos veces, entra una sola fila.
  id                 uuid          primary key,
  fecha              date          not null,
  tipo               text          not null check (tipo in ('ingreso', 'egreso', 'transferencia')),
  monto              numeric(14,2) not null check (monto > 0),
  cuenta_id          uuid          not null references cuentas(id) on delete restrict,
  cuenta_destino_id  uuid          references cuentas(id) on delete restrict,
  categoria_id       uuid          references categorias(id) on delete restrict,
  -- Copia de categorias.grupo al momento de cargar.
  grupo              text          check (grupo in ('ingreso', 'negocio', 'familia')),
  obra_id            uuid          references obras(id) on delete restrict,
  proveedor_id       uuid          references proveedores(id) on delete restrict,
  personal_id        uuid          references personal(id) on delete restrict,
  gasto_fijo_id      uuid          references gastos_fijos(id) on delete set null,
  periodo            text,
  nota               text,
  creado_por         uuid          references admin_users(id) on delete set null,
  created_at         timestamptz   not null default now(),
  -- El libro no se edita ni se borra: corregir es anular y cargar de nuevo.
  anulado_en         timestamptz,
  anulado_por        uuid          references admin_users(id) on delete set null,
  anulado_motivo     text,
  check ((tipo = 'transferencia') = (cuenta_destino_id is not null)),
  check (cuenta_destino_id is null or cuenta_destino_id <> cuenta_id),
  check (
    (tipo = 'transferencia'
      and categoria_id is null and grupo is null
      and obra_id is null and proveedor_id is null and personal_id is null)
    or (tipo <> 'transferencia' and categoria_id is not null and grupo is not null)
  ),
  check (proveedor_id is null or obra_id is null),
  check (grupo is distinct from 'familia' or (obra_id is null and proveedor_id is null and personal_id is null)),
  check ((anulado_en is null) = (anulado_motivo is null))
);

create index if not exists movimientos_fecha_idx on movimientos (fecha desc);
create index if not exists movimientos_obra_idx on movimientos (obra_id) where obra_id is not null;
create index if not exists movimientos_proveedor_idx on movimientos (proveedor_id) where proveedor_id is not null;
create index if not exists movimientos_personal_idx on movimientos (personal_id) where personal_id is not null;

-- Parcial: un gasto fijo anulado se puede volver a generar para ese período.
create unique index if not exists movimientos_gasto_fijo_uq
  on movimientos (gasto_fijo_id, periodo)
  where anulado_en is null and gasto_fijo_id is not null;

-- Todo reporte lee de acá, nunca de la tabla: así un anulado no se cuela en una suma.
create or replace view movimientos_vigentes as
  select * from movimientos where anulado_en is null;

create table if not exists tareas (
  id           uuid        primary key default gen_random_uuid(),
  titulo       text        not null,
  detalle      text,
  personal_id  uuid        references personal(id) on delete set null,
  obra_id      uuid        references obras(id) on delete set null,
  vence_el     date,
  hecha_en     timestamptz,
  creado_por   uuid        references admin_users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists tareas_personal_idx on tareas (personal_id) where hecha_en is null;

-- Datos de la empresa (CUIT, seguros, contactos útiles). Nunca contraseñas.
create table if not exists empresa_notas (
  id          uuid        primary key default gen_random_uuid(),
  titulo      text        not null,
  contenido   text        not null,
  updated_at  timestamptz not null default now(),
  actualizado_por uuid    references admin_users(id) on delete set null
);

-- Preguntas al asistente por mes ('2026-11'), para acotar el gasto en OpenAI.
create table if not exists asistente_uso (
  mes        text primary key,
  preguntas  int  not null default 0
);

-- Datos iniciales. Los que el dueño puede renombrar solo se cargan si la tabla
-- está vacía: si no, cada migración volvería a crear los nombres viejos.
insert into cuentas (nombre, tipo)
select v.nombre, v.tipo
from (values ('Efectivo', 'efectivo'), ('Banco', 'banco'), ('Mercado Pago', 'billetera')) as v(nombre, tipo)
where not exists (select 1 from cuentas);

insert into categorias (nombre, grupo, clave) values
  ('Cobro de obra', 'ingreso', 'cobro_obra'),
  ('Devolución a cliente', 'ingreso', 'devolucion_cliente'),
  ('Pago a proveedor', 'negocio', 'pago_proveedor'),
  ('Devolución de proveedor', 'negocio', 'devolucion_proveedor'),
  ('Comisiones', 'negocio', 'comision')
on conflict do nothing;

insert into categorias (nombre, grupo)
select v.nombre, v.grupo
from (values
  ('Otros ingresos', 'ingreso'),
  ('Alquiler', 'negocio'),
  ('Luz del taller', 'negocio'),
  ('Celular', 'negocio'),
  ('Comida', 'negocio'),
  ('Viáticos', 'negocio'),
  ('Nubera', 'negocio'),
  ('Sueldos y adelantos', 'negocio'),
  ('Flete', 'negocio'),
  ('Mano de obra de terceros', 'negocio'),
  ('Otros gastos', 'negocio'),
  ('Envío diario', 'familia'),
  ('Luz de casa', 'familia'),
  ('Gas', 'familia'),
  ('Wifi', 'familia'),
  ('Otros gastos de la familia', 'familia')
) as v(nombre, grupo)
where not exists (select 1 from categorias where clave is null);

-- Montos de la planilla del taller. La frecuencia se confirma con Marcelo y se
-- corrige desde el panel; cada uno se revisa antes de generarlo.
insert into gastos_fijos (nombre, categoria_id, monto, frecuencia)
select v.nombre, c.id, v.monto, v.frecuencia
from (values
  ('Alquiler', 'negocio', 350000::numeric, 'mensual'),
  ('Luz del taller', 'negocio', 50000::numeric, 'mensual'),
  ('Celular', 'negocio', 65000::numeric, 'mensual'),
  ('Comida', 'negocio', 200000::numeric, 'semanal'),
  ('Viáticos', 'negocio', 140000::numeric, 'semanal'),
  ('Nubera', 'negocio', 35000::numeric, 'mensual'),
  ('Envío diario', 'familia', 105000::numeric, 'semanal'),
  ('Luz de casa', 'familia', 25000::numeric, 'mensual'),
  ('Gas', 'familia', 25000::numeric, 'mensual'),
  ('Wifi', 'familia', 25000::numeric, 'mensual')
) as v(nombre, grupo, monto, frecuencia)
join categorias c on c.nombre = v.nombre and c.grupo = v.grupo
where not exists (select 1 from gastos_fijos);

-- WhatsApp por Kapso (2026-11-09). Un contacto de WhatsApp es una fila de
-- conversations con wa_phone: el número tal como lo manda WhatsApp, solo dígitos.
--   role 'human': lo escribió una persona, desde el panel o desde la app.
alter table messages drop constraint if exists messages_role_check;
alter table messages add constraint messages_role_check
  check (role in ('user', 'assistant', 'human'));
alter table messages add column if not exists wa_message_id text;
-- sent | delivered | read | failed. Null en los mensajes del chat de la web.
alter table messages add column if not exists status text;
alter table messages add column if not exists message_type text;
create unique index if not exists messages_wa_message_idx
  on messages (wa_message_id) where wa_message_id is not null;

alter table conversations add column if not exists wa_phone text;
-- Null = usa el modo general de whatsapp_config.
alter table conversations add column if not exists ai_mode_override text
  check (ai_mode_override in ('OFF', 'SUGGEST', 'AUTO'));
-- Abre la ventana de 24 h de WhatsApp para escribirle sin plantilla.
alter table conversations add column if not exists last_inbound_at timestamptz;
create unique index if not exists conversations_wa_phone_idx
  on conversations (site_id, wa_phone) where wa_phone is not null;

-- Una fila por sitio. Los ids los carga db/kapso-setup.mjs al conectar el número.
create table if not exists whatsapp_config (
  site_id         text primary key,
  mode            text not null default 'SUGGEST' check (mode in ('OFF', 'SUGGEST', 'AUTO')),
  phone_number_id text,
  workflow_id     text,
  updated_at      timestamptz not null default now()
);
insert into whatsapp_config (site_id) values ('mcp') on conflict (site_id) do nothing;

-- Kapso entrega cada evento al menos una vez: acá se descartan los repetidos.
create table if not exists whatsapp_webhook_events (
  id          text primary key,
  event       text,
  received_at timestamptz not null default now()
);
