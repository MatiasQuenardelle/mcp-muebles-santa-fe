# Handoff — Panel de admin / CRM del chatbot (MCP Muebles)

**Estado (2026-08-05): build verde y panel vivo en producción.**
`npm run build` compila las 16 rutas. Verificado contra `https://mcpmuebles.com`:
`/admin` sin cookie → 307 a `/admin/login`; `POST /api/admin/cards/tick` sin cookie → 401;
clave incorrecta → 401; `/`, `/proyecto-cocina`, `/sitemap.xml`, `/robots.txt` y el OG image → 200;
`robots.txt` ya trae `Disallow: /admin` + `/api/admin`. Las 4 env vars están cargadas en Vercel
(Production) y el schema de `db/schema.sql` coincide con Neon, `hot_notified_at` incluido.
La fila de prueba `1111...` ya no existe.

**No verificado todavía:** la UI del panel por dentro. El CLI de Vercel redacta los secretos al
hacer `env pull` (`ADMIN_PASSWORD=""`), así que no se pudo loguear por `curl`. Falta abrir
`/admin` con la clave real y mirar el panel en el iPhone.

Plan completo original: `/Users/matiasquenardelle/.claude/plans/calm-stargazing-glade.md`

---

## Qué se construyó

Un mini-CRM en `mcpmuebles.com/admin` donde Marcelo ve cada conversación del chatbot, con una
tarjeta de contacto generada por IA al final de cada charla (resumen + datos del cliente +
temperatura del lead), estado de gestión editable y notas.

### Base de datos (LISTO y aplicado)

Proyecto Neon **`mcp-muebles`** — `project_id: tiny-truth-06910386`, región `aws-us-east-2`,
org `org-fragrant-shadow-49580467`.

Tablas creadas y verificadas: `conversations` (18 col.), `messages` (5 col.), `leads` (11 col.)
+ 4 índices. Schema versionado en `mcp-landing/db/schema.sql`.

El connection string se saca del MCP de Neon (`get_connection_string` con ese project_id) o de la
consola. **No pegarlo en este archivo ni en ningún archivo commiteado.**

> ⚠️ Hay una fila de prueba en `conversations` con id `11111111-1111-1111-1111-111111111111`.
> Borrarla: `delete from conversations where id = '11111111-1111-1111-1111-111111111111';`

### Archivos nuevos

| Archivo | Qué hace |
|---|---|
| `mcp-landing/db/schema.sql` | Schema versionado |
| `mcp-landing/lib/db.ts` | Acceso a Neon (driver HTTP), singleton perezoso, todas las queries |
| `mcp-landing/lib/crm.ts` | Tipos/constantes compartidos server↔cliente (no importa `lib/db`) |
| `mcp-landing/lib/card.ts` | Extractor de la tarjeta con OpenAI `json_schema` strict |
| `mcp-landing/lib/auth.ts` | HMAC-SHA256 con Web Crypto, `requireAdmin()` |
| `mcp-landing/lib/adminFormat.ts` | Formato de fechas (zona AR), badges, normalizar teléfono |
| `mcp-landing/middleware.ts` | Protege `/admin/*` y `/api/admin/*` |
| `mcp-landing/app/api/admin/login/route.ts` | POST login / DELETE logout |
| `mcp-landing/app/api/admin/cards/tick/route.ts` | Genera tarjetas pendientes de a 3 |
| `mcp-landing/app/api/admin/conversations/[id]/route.ts` | PATCH estado / notas / regenerar |
| `mcp-landing/app/(admin)/layout.tsx` | Layout del panel, `robots: noindex` |
| `mcp-landing/app/(admin)/admin/page.tsx` | Dashboard: métricas + buscador + lista |
| `mcp-landing/app/(admin)/admin/login/page.tsx` | Login |
| `mcp-landing/app/(admin)/admin/c/[id]/page.tsx` | Detalle: tarjeta + transcripción + acciones |
| `mcp-landing/app/(site)/layout.tsx` | GA/Ads/Clarity + AttributionTracker + metadata pública |
| `mcp-landing/components/admin/*.tsx` | `LoginForm`, `LogoutButton`, `SearchBox`, `CardGenerator`, `ConversationActions` |

### Archivos modificados

- `app/api/chat/route.ts` — cookie HttpOnly `mcp_cid` minteada por el servidor, guarda el mensaje
  del usuario **antes** de llamar a OpenAI y la respuesta después, límites server-side.
- `app/api/lead/route.ts` — persiste a la tabla `leads` y enlaza con la conversación por cookie.
- `components/proyecto/ChatWidget.tsx` — manda `page` y `attribution` a `/api/chat`, ya no manda
  `transcript` a `/api/lead`.
- `lib/lead.ts` — sacado el campo `transcript` de `LeadPayload`.
- `lib/chatbot.ts` — regla 7 nueva: el bot pide el nombre una vez antes de cerrar.
- `app/layout.tsx` — quedó mínimo (html/body/fuentes). Todo el marketing se movió a `(site)`.
- `package.json` — nueva dependencia `@neondatabase/serverless` (ya instalada).

### Movidos con `git mv` (route groups)

`app/page.tsx` → `app/(site)/page.tsx` · `app/proyecto-cocina/` → `app/(site)/proyecto-cocina/` ·
`app/opengraph-image.tsx` → `app/(site)/opengraph-image.tsx`.
`robots.ts` y `sitemap.ts` quedaron en `app/` (correcto).

Motivo: sin esto, cada vez que Marcelo abre `/admin` dispara eventos de GA4/Ads y se pisa su propia
cookie de atribución con `landing=/admin`.

---

## LO QUE FALTA (actualizado 2026-08-05)

### 1. Telegram sin configurar → los leads no le llegan a nadie (lo más importante)

`lib/notify.ts` está terminado y `hot_notified_at` hace de lock para no avisar dos veces el mismo
lead. Pero en Vercel **no están** `TELEGRAM_BOT_TOKEN` ni `TELEGRAM_CHAT_ID`, así que `sendTelegram`
devuelve `false` y no pasa nada: hoy alguien puede dejar el teléfono en el chat y Marcelo no se
entera hasta que abre el panel a mano. Tampoco está `LEAD_WEBHOOK_URL` (aviso de tarjeta caliente).

Sacar el token con @BotFather (`/newbot`), mandarle un mensaje al bot y leer el `chat.id` en
`https://api.telegram.org/bot<TOKEN>/getUpdates`. Después `vercel env add` de las dos y redeploy.

### 2. GA4 y Google Ads NO están corriendo en producción

El HTML de `https://mcpmuebles.com/` no trae `gtag` ni `googletagmanager`: cero coincidencias de
`G-` y de `AW-`. Solo carga Clarity. En Vercel faltan `NEXT_PUBLIC_GOOGLE_TAG_ID`,
`NEXT_PUBLIC_GOOGLE_ADS_ID` y `NEXT_PUBLIC_GOOGLE_ADS_SEND_TO`. El código en `(site)/layout.tsx` ya
los inyecta cuando existen. Sin esto no hay medición de conversiones ni atribución — que es
justamente el objetivo del proyecto.

### 3. Trabajo sin commitear

El working tree tiene la pestaña de WhatsApp, los filtros, el auto-refresh y los avisos
(`AdminTabs`, `AutoRefresh`, `FilterChips`, `app/(admin)/admin/whatsapp/`, `lib/notify.ts`,
`lib/db.ts`, `db/schema.sql`) sin commitear. Producción se desplegó desde el working tree por CLI,
así que **prod está adelante de `main`**. Commitear antes de tocar nada más.

### 4. Datos de demo en la base

Hay 3 conversaciones sembradas con ids `aaaaaaaa-000X-...` ("Sofia Ramirez", "Diego Paz"), con
tarjetas ya generadas. Sirven para mostrarle el panel a Marcelo; borrarlas antes de que lo use en
serio:

```sql
delete from conversations where id::text like 'aaaaaaaa-%';
```

### 5. Falta mirar el panel por dentro

Nada de la UI se vio renderizada. Abrir `/admin` con la clave real y revisar en el iPhone
(`documentElement.scrollWidth === clientWidth`), incluidos `/admin/c/[id]` y `/admin/whatsapp`.

### Ya resuelto (no rehacer)

- Build verde, imports de `lib/crm.ts` sanos.
- `/admin/login` ya no usa `useSearchParams()`: el `next` se lee y se valida en el server component
  y baja como prop. Sin `<Suspense>` y sin open redirect.
- `robots.ts` con `disallow: ['/admin', '/api/admin']`, ya vivo en prod.
- Las 4 env vars del panel cargadas en Vercel Production y en `.env.local`.
- `.env.example` completo (incluye las de admin, webhook y Telegram).
- `apple-touch-icon` (200 en prod) y `public/admin.webmanifest`.
- Botón "Regenerar resumen" (`components/admin/RegenerateCardButton.tsx`).
- Fila de prueba `1111...` borrada.

---

## Referencia histórica (ya hecho, se deja por contexto)

### 1. Variables de entorno (bloqueante)

Agregar a `mcp-landing/.env.local` y a Vercel (Production + Preview):

```
DATABASE_URL=<connection string de Neon, proyecto tiny-truth-06910386>
ADMIN_PASSWORD=<la que elija Marcelo>
ADMIN_SESSION_SECRET=<openssl rand -hex 32>
IP_HASH_SALT=<openssl rand -hex 16>
```

Y agregar esos 4 **nombres** (con valores placeholder) a `mcp-landing/.env.example`,
que todavía no se tocó.

Sin `DATABASE_URL` la app arranca igual: `isDatabaseConfigured()` la deja pasar y el chatbot
funciona como antes, solo que no guarda nada. Sin `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` el login
devuelve 503.

### 2. Que compile (bloqueante)

```bash
cd "mcp-landing" && npm run build
```

Quedó a medias una refactorización de tipos: `ContactCard` y `ConversationStatus` se movieron de
`lib/db.ts` a `lib/crm.ts` (porque `ConversationActions.tsx` es un componente cliente y estaba
arrastrando el driver de Postgres al bundle). Ya se actualizaron los imports en `crm.ts`, `db.ts`,
`card.ts`, `adminFormat.ts`, `ConversationActions.tsx` y `api/admin/conversations/[id]/route.ts`,
pero **no se verificó que no quede ninguno colgado**. Revisar también que `lib/db.ts` siga
re-exportando bien los tipos.

Además: `SearchBox` y `LoginForm` usan `useSearchParams()`, que en Next 14 puede exigir un
`<Suspense>` alrededor durante el prerender. Si el build se queja, envolver.

### 3. `robots.ts` no bloquea `/admin`

Hoy es `allow: '/'` a secas (`app/robots.ts`). Agregar `disallow: ['/admin', '/api/admin']`.
El `noindex` del layout `(admin)` ya está, pero conviene el doble candado.

### 4. Verificación end-to-end (nada de esto se hizo)

- Deploy a preview de Vercel.
- `curl` con cookies (`-c/-b`) a `/api/chat`, dos turnos → confirmar por SQL 1 conversación y
  4 mensajes, y que `message_count` sube.
- Forzar `update conversations set last_message_at = now() - interval '1 hour'`, llamar a
  `POST /api/admin/cards/tick` con la cookie de admin → confirmar que `card` se pobló.
- Login: sin cookie → redirect a `/admin/login`; cookie manipulada → rechazo;
  `POST /api/admin/cards/tick` sin cookie → 401.
- Screenshots mobile con Playwright (`devices["iPhone 13"]`) de `/admin` y `/admin/c/[id]`,
  chequeando `documentElement.scrollWidth === clientWidth`.
- **Confirmar que el sitio público no se rompió** con el cambio a route groups: `/` y
  `/proyecto-cocina` cargan, GA y Clarity siguen inyectándose, `/opengraph-image`, `/sitemap.xml`
  y `/robots.txt` devuelven 200.

⚠️ Nunca levantar `npm run dev` (instrucción global de Matías). Verificar con `npm run build` y
contra el deploy de preview de Vercel.

### 5. Pendientes menores del plan

- **Aviso de lead caliente** (Fase 5, sin empezar): disparar `LEAD_WEBHOOK_URL` cuando una tarjeta
  sale `temperatura: caliente`. Sin esto el panel es un tablero que nadie abre. La variable ya
  existe en `/api/lead` pero no está seteada en Vercel.
- `apple-touch-icon` + manifest para "Agregar a inicio" en el iPhone.
- Botón "Regenerar resumen" en el detalle: el backend ya lo soporta
  (`PATCH { regenerateCard: true }`), falta el botón en la UI.

---

## Decisiones ya tomadas (no re-preguntar)

1. Mini-CRM con estados + métricas (no solo lectura).
2. Contraseña única compartida, no usuarios.
3. Tarjetas generadas al abrir el panel (sin cron — Vercel Hobby solo permite 1 cron por día).
4. Específico de MCP pero portable: columna `site_id` en las tablas y prompt del extractor
   parametrizable en `lib/card.ts` (constante `NEGOCIO`).

## Detalles no obvios del diseño

- **El id de conversación lo mintea el servidor**, no el cliente. Si lo generara el cliente,
  cualquiera podría postear el id de otro e inyectarle mensajes.
- **El mensaje del usuario se guarda antes de llamar a OpenAI**, para no perder justo las
  conversaciones donde el bot falló.
- **Se hace `await` de las escrituras**: Vercel congela la lambda apenas responde y un
  fire-and-forget se pierde en silencio.
- **Las tarjetas NO se generan en el server component**: el timeout de Hobby es 10s y cada tarjeta
  tarda ~2s. Se generan de a 3 desde el cliente (`CardGenerator`) con lock optimista sobre
  `card_claimed_at` (el driver HTTP de Neon no soporta `SELECT ... FOR UPDATE`).
- **`requireAdmin()` se re-verifica en cada route handler**, no solo en el middleware: la familia
  next 14.2 tuvo un bypass de auth por middleware (CVE-2025-29927) y el rango `^14.2.0` del
  `package.json` puede moverse.
- **El corte de mensajes es server-side** (`MAX_MESSAGES_PER_CONVERSATION`): el tope de 20 del
  `ChatWidget` es cosmético, `/api/chat` es un endpoint abierto.
- **Fechas en `America/Argentina/Buenos_Aires`**: la base guarda UTC y todos los "hace 3 horas"
  saldrían corridos.

---

## Tip para la próxima sesión

Para no comerte un prompt de permiso por cada archivo: `Shift+Tab` cambia a modo
**accept-edits**, o corré `/fewer-permission-prompts` para armar una allowlist en
`.claude/settings.json`.
