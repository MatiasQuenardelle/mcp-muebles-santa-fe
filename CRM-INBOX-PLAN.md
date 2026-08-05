# Plan — Panel /admin de MCP Muebles → inbox estilo atenbot/zapia

> Estado: **implementado y verificado en preview** el 2026-08-05. Falta promover a producción.

## De dónde sale

El CRM viejo de atenbot (pre-pivot, cuando integraba con Kapso) está en
`/Users/matiasquenardelle/repos/zapia`. No se porta nada de Kapso: solo el **layout, la
densidad visual y los patrones de UI** de su inbox, conectados al chatbot web que ya escribe
en Neon.

Archivos de referencia en zapia (solo para mirar, no se copian tal cual):

```
src/components/inbox/inbox-layout.tsx       # orquestador de paneles
src/components/inbox/conversation-list.tsx  # lista + búsqueda + filtros
src/components/inbox/chat-panel.tsx         # thread + header + composer
src/components/inbox/message-bubble.tsx     # burbujas + colitas SVG
src/app/globals.css                         # tokens de color
```

## Decisiones tomadas

- **Sin live chat.** El bot es web y el visitante ya se fue cuando Marcelo abre el panel. El
  panel es de lectura + accionar por WhatsApp/teléfono. No se toca el sitio público.
- **Inbox de 2 paneles.** Zapia tiene 3; el tercero es su panel de IA, que no aplica acá.
- **Sin sugerencias de IA** de respuesta por ahora.
- **Paleta MCP** (`brand-cream/gold/dark/border/card`), no el dark naranja de zapia.

---

## Arquitectura: dos paneles server-rendered en `/admin`

La opción idiomática de Next (lista en un `layout.tsx`, thread en `c/[id]/page.tsx`) **no
sirve**: los layouts de Next 14 no reciben `searchParams`, y la búsqueda (`?q=`) y los filtros
(`?f=`) viven en la URL. Y un inbox 100% cliente como el de zapia obligaría a duplicar en
rutas API todas las queries que hoy los server components llaman directo.

**Enfoque elegido: `/admin?c=<id>` — un solo server component que renderiza los dos paneles.**

```
/admin                → lista sola (mobile) / lista + estado vacío (desktop)
/admin?c=<uuid>       → lista + conversación seleccionada
/admin?q=…&f=…&c=…    → todo compone
```

- Cero rutas API nuevas, cero fetching en cliente: se reusan `listConversations`,
  `getConversation`, `getMessages`, `getStats` tal como están.
- Seleccionar una conversación es un `<Link href="/admin?c=…" scroll={false}>` → navegación
  RSC, sin recarga; React reconcilia la lista y conserva el scroll.
- **Mobile sale gratis**: con `c` presente se muestra el thread, sin `c` la lista. Puro
  condicional de clases, sin máquina de estados en cliente (zapia necesita `useIsMobile()` +
  estado `mobilePanel`; acá no hace falta).
- `/admin/c/[id]` pasa a ser un `redirect()` a `/admin?c=<id>` — los deep links viejos siguen
  andando y se elimina la duplicación de la vista de detalle.

Costo: cada click re-corre `listConversations` + `getStats` en el server (~50-150 ms sobre
Neon HTTP). Aceptable para un panel de una persona.

Altura: `(admin)/layout.tsx` sigue con `min-h-screen`; la page de `/admin` se envuelve en
`h-[100dvh] flex overflow-hidden` para que cada panel scrollee por su cuenta.

---

## Qué se porta de zapia y qué no

| De zapia | Acción |
|---|---|
| Layout 2 paneles, lista `w-[30%] min-w-[280px] max-w-[420px]` | **Portar** |
| Item de lista: avatar + nombre + hora relativa + preview truncado + badge | **Portar** |
| Avatar con iniciales y color HSL del hash del nombre (`conversation-list.tsx:41-55`) | **Portar** sin `ui-avatars.com` (fetch externo innecesario) |
| Burbujas con colita SVG, agrupación por remitente, separadores de día, timestamp `float-right` | **Portar**, recoloreado a MCP |
| Header sticky: avatar + nombre + teléfono + **dropdown de etapa con punto de color** | **Portar** — mapea 1:1 a los 5 `ConversationStatus` de MCP |
| No leídos | **Portar arreglado.** Zapia lo guarda en `localStorage` y el badge muestra el total de mensajes, no los no leídos. Acá va a DB. |
| Modo selección + acciones bulk | **No** — con este volumen es superficie de más |
| Tags | **No** — `status` + `notes` ya cubren; en zapia ni siquiera tiene UI |
| SSE en vivo | **No** — `AutoRefresh` (60 s) ya está, y un SSE de 50 s por pestaña abierta quema horas de función en Vercel Hobby |
| Composer, ticks de entrega, audio/imagen, panel IA, modos OFF/SUGGEST/AUTO, sidebar multi-tenant | **No** — no hay canal saliente ni multi-cliente |

**Cambio deliberado de convención:** hoy el detalle pone al **visitante a la derecha** en
oscuro. En un CRM el cliente va a la **izquierda** y lo propio (el bot) a la derecha — es lo
que hace zapia y lo que espera cualquiera que usó un inbox. Se invierte: visitante = burbuja
blanca izquierda, asistente = `bg-brand-dark` derecha con micro-etiqueta "IA". Es un cambio de
una línea si no gusta.

---

## Cambios concretos

### 1. Base de datos — una sola columna

En `mcp-landing/db/schema.sql` (es idempotente), dentro del `create table conversations`:

```sql
  -- Última vez que se abrió la conversación en el panel. Está no leída cuando
  -- last_message_at > last_read_at. En la base y no en localStorage para que el
  -- estado sea el mismo desde la compu y desde el celular.
  last_read_at       timestamptz
```

Y en el bloque de migraciones, al lado del `hot_notified_at`:

```sql
alter table conversations add column if not exists last_read_at timestamptz;
```

Aplicar con `npm run db:push`. No leída ⇔ `last_message_at > coalesce(last_read_at, 'epoch')`.

> ✅ Aplicado en Neon el 2026-08-05 (`npm run db:push`), columna verificada.

### 2. `mcp-landing/lib/db.ts`

- `ConversationRow`: agregar `last_read_at: string | null` y un booleano derivado `unread`,
  calculado en el `select` de `listConversations` y `getConversation`:
  `(last_message_at > coalesce(last_read_at, 'epoch'::timestamptz)) as unread`
- `listConversations`: nueva rama de filtro `no_leidas` dentro del `and (…)` que ya existe,
  con el mismo patrón que `pendientes`/`calientes`.
- Nueva `markConversationRead(id)`:
  `update conversations set last_read_at = now() where id = ${id}::uuid`

### 3. `mcp-landing/lib/crm.ts`

Agregar `'no_leidas'` a `ConversationFilter`, `CONVERSATION_FILTERS` y `FILTER_LABELS`
(etiqueta: `'No leídas'`). `parseFilter` no cambia — valida contra el array.

### 4. `mcp-landing/lib/adminFormat.ts`

Agregar helpers puros, usables desde server y cliente:

- `nameToHue(name)` — hash del nombre → 0-359 (portado de `conversation-list.tsx:41-55`)
- `initials(name)` — 1-2 letras
- `dayLabel(date)` — `"Hoy" | "Ayer" | "5 de agosto de 2026"`, forzado a
  `America/Argentina/Buenos_Aires` como el resto del módulo
- `STATUS_DOTS: Record<ConversationStatus, string>` — clases `bg-*` para el punto del
  dropdown; hermano del `STATUS_STYLES` que ya existe

### 5. Componentes nuevos — `mcp-landing/components/admin/`

| Archivo | c/s | Qué hace |
|---|---|---|
| `ContactAvatar.tsx` | server | Círculo con iniciales, `backgroundColor: hsl(hue 55% 38%)`; ícono genérico si no hay nombre |
| `ConversationList.tsx` | server | Panel izquierdo: items `<Link href="/admin?c=…">`, activo con `bg-brand-card border-l-2 border-brand-gold`, punto de no leída, hora relativa, preview del `card.resumen` |
| `Thread.tsx` | server | Burbujas + colitas SVG + agrupación + separadores de día. Recibe `MessageRow[]` |
| `StatusDropdown.tsx` | **client** | Reemplaza las píldoras de estado por el dropdown compacto del header (punto + label + chevron). Mismo `PATCH {status}` optimista que hoy |
| `NotesBox.tsx` | **client** | Las notas, extraídas de `ConversationActions` para poder ubicarlas en el scroll del panel derecho |
| `MarkRead.tsx` | **client** | Renderiza `null`; en mount hace `PATCH {read:true}`. Mismo patrón que `CardGenerator` (no se escribe desde un server component) |

### 6. Componentes modificados

- **`app/(admin)/admin/page.tsx`** — pasa a ser el shell de 2 paneles. Lee `searchParams.c`,
  valida contra `UUID_RE`, y si hay `c` carga `getConversation` + `getMessages` en el mismo
  `Promise.all` que ya hace `listConversations` + `getStats`. Header, `AdminTabs`, métricas,
  `SearchBox`, `FilterChips`, `CardGenerator` y `AutoRefresh` se conservan.
- **`app/(admin)/admin/c/[id]/page.tsx`** — se reduce a `redirect('/admin?c=' + id)`. Todo su
  contenido (tarjeta, `Field`/`Block`, transcripción) se muda al panel derecho.
- **`components/admin/ConversationActions.tsx`** — queda solo la barra WhatsApp / Llamar /
  Copiar, fija al pie del panel derecho. El estado se va a `StatusDropdown`, las notas a
  `NotesBox`. La lógica de `waMessage` y `normalizePhone` se conserva tal cual.
- **`components/admin/SearchBox.tsx` y `FilterChips.tsx`** — propagar el `c` actual al armar
  las URLs, para no perder la selección al buscar o filtrar.
- **`app/api/admin/conversations/[id]/route.ts`** — aceptar `{ read: true }` en el PATCH que ya
  existe, delegando en `markConversationRead`. Sigue re-verificando `requireAdmin()`.

### 7. Panel derecho — orden vertical

```
┌ header sticky: avatar · nombre · teléfono · [● Contactado ▾] · badge temperatura
├ scroll:
│    Tarjeta de contacto (resumen + campos + Regenerar)   ← lo que hoy está en /admin/c/[id]
│    Notas
│    Transcripción (burbujas, separadores de día)
└ footer sticky: [WhatsApp] [Llamar] [Copiar]
```

En mobile el header lleva un `←` que vuelve a `/admin?q=…&f=…`.

---

## Verificación

> Hecha el 2026-08-05 contra el preview
> `mcp-landing-djnsbt1gt-matias-quenardelles-projects.vercel.app`. Los pasos 1-6 pasaron;
> queda pendiente el 7.
>
> Detalle útil para la próxima: el preview está detrás del SSO de Vercel, pero el proyecto
> **ya tiene un token de `automation-bypass`** (se lee con `GET /v9/projects/{id}` de la API
> de Vercel). Mandándolo como header `x-vercel-protection-bypass` Playwright entra sin tocar
> la configuración de Deployment Protection. Ojo: `vercel` hay que correrlo desde la raíz del
> repo, no desde `mcp-landing/`, porque el root directory del proyecto ya es `mcp-landing`.

1. `cd mcp-landing && npm run build` — verde. **Nunca `npm run dev`.**
2. `npm run db:push`, y confirmar que la columna existe:
   `select column_name from information_schema.columns where table_name='conversations'`
3. Chequear que `StatusDropdown` / `NotesBox` / `MarkRead` importen tipos desde `lib/crm.ts` y
   **nunca** desde `lib/db.ts` — arrastraría el driver de Postgres al bundle del navegador. Es
   la trampa que ya documenta `CRM-CHATBOT-HANDOFF.md`.
4. Deploy a **preview** de Vercel, no a producción.
5. Playwright con `devices["iPhone 13"]` y desktop 1440px contra el preview, sobre `/admin`,
   `/admin?c=<id>` y `/admin/whatsapp`; assert `documentElement.scrollWidth === clientWidth`
   en las tres. Requiere la contraseña de admin (el CLI de Vercel la redacta al hacer
   `env pull`).
6. Funcional sobre el preview: abrir una conversación → el punto de no leída desaparece y no
   vuelve al recargar; cambiar el estado desde el dropdown → persiste; buscar con una
   conversación abierta → no se pierde la selección; `/admin/c/<uuid>` → redirige.
7. Recién ahí, promover a producción.

## Fuera de alcance

Bulk actions, tags, SSE, live chat, sugerencias de IA.

Sin relación con esto, sigue pendiente de `CRM-CHATBOT-HANDOFF.md`: Telegram y GA4/Ads no
están cargados en Vercel, y hay 3 conversaciones de demo (`aaaaaaaa-%`) para borrar.
