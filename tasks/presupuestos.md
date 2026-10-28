# Plan: Generador de presupuestos en mcpmuebles.com (admin + calculadora)

## Contexto

Marcelo arma los presupuestos en un Excel al que se le rompen las fórmulas. Hoy le dimos una plantilla
(`presupuestos/`, generador en `presupuestos/generador/build.py`) con 4 fases (materiales, producción,
mano de obra, mesada y extras), pago en 4 etapas (etapa N = total de la fase N; la 4 es el saldo) y un PDF
para el cliente con el logo. Marcelo pidió llevar esto a la web.

Decisiones tomadas con Matías:
- **Fase 1, admin:** el generador formal vive en el CRM `/admin` y reemplaza al Excel. Cada presupuesto queda
  ligado al contacto. Marcelo lo usa desde el celular, así que el PDF tiene que ser un archivo real que pueda
  compartir por WhatsApp.
- **Fase 2, calculadora pública** (`/cocinas#calculadora`): el visitante descarga un **PDF preliminar a cambio
  de nombre + WhatsApp**. Entra como contacto en el CRM (origen `calculadora`) y le llega aviso a Marcelo.
  Las etapas de pago van **explicadas, sin montos**.
- **El detalle de costos (melamina, cortes, mano de obra) nunca es público.** El preliminar muestra solo lo que
  ya publica la calculadora: línea, módulos, metros, precio de lista y total orientativo.
- **Sin IA:** todo es cálculo determinístico. El costo por presupuesto es ~USD 0 (Neon y Vercel ya existen).

## Paso 0: dejar el repo limpio (antes de tocar nada)

- El working tree tiene ~47 archivos sin commitear del CRM (cuentas por persona y responsable por contacto), que
  ya está en prod. Commitearlos aparte, **con el OK de Matías**, siguiendo `tasks/lessons.md`: revisar
  `git status` y el diff de `db/schema.sql`.
- Disco: quedan ~1,4 GB. `@react-pdf/renderer` suma ~30 MB a `node_modules`, así que hay que avisar si baja de 1 GB.

## Fase 1: generador formal en el admin

### Dominio compartido: `lib/presupuesto.ts` (TS puro, sin db; lo usan el editor y el PDF)
- Tipos:
  - `Item { concepto, cantidad, precio }`
  - `Seccion { id: 'materiales'|'produccion'|'mano_obra'|'mesada', items }`
  - `PresupuestoData { cliente, localidad, proyecto, fecha, validezDias, entrega, garantia, secciones }`
- `ITEMS_DEFAULT`: se portan de `presupuestos/generador/build.py` (15 + 4 + 1 + 3 renglones, con los precios
  vigentes de Natalia).
- `calcular(data)` devuelve subtotales por sección, total y `etapas[4]` (`{titulo, explicacion, monto, pct}`).
  Los textos de etapas, `CARACTERISTICAS`, `CALIDAD` y `ALCANCE` salen de `build.py`.
- `parsePresupuestoData(body)`: validación del lado del servidor. Usa el estilo de `InputError` de
  `lib/adminInput.ts`, con números ≥ 0 y límites de largo.

### Base de datos: `db/schema.sql` (estilo `create ... if not exists`; se aplica con `npm run db:push` ANTES del deploy)
```sql
create sequence if not exists presupuesto_numero_seq;
create table if not exists presupuestos (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  numero text not null,                 -- '2026-001', año + secuencia
  kind text not null default 'formal',  -- formal | preliminar
  data jsonb not null,
  total numeric(14,2) not null,
  sent_at timestamptz,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists presupuestos_conversation_idx on presupuestos(conversation_id);
```
En `lib/db.ts` van `createPresupuesto`, `updatePresupuesto`, `getPresupuesto`, `listPresupuestos(conversationId)`,
`deletePresupuesto` y `lastFormalItems()`. Esta última hace que "Nuevo presupuesto" copie los precios del último
presupuesto formal, así los precios se actualizan solos sin una pantalla de lista de precios. Si no hay
ninguno, usa `ITEMS_DEFAULT`.

### PDF: `@react-pdf/renderer`, generado del lado del servidor
- **Por qué esta opción:** da un archivo real que se descarga en el celular y se comparte por WhatsApp.
  `window.print()` no anda en los navegadores internos de Instagram y WhatsApp.
- `components/pdf/PropuestaPdf.tsx`: el mismo diseño que el PDF de Natalia.
  - Bloques: encabezado con logo, datos del cliente, características, detalle por fase (sin renglones en
    cero), resumen + precio final, etapas, "¿Cómo seguimos?", calidad y alcance.
  - Variante `preliminar`: módulos de la calculadora, etapas sin montos y aviso "orientativo, el precio final
    sale del relevamiento".
- Fuente Helvetica integrada (cubre ñ, tildes y ²). Viñetas con "•" en lugar de "✓", que no está en la fuente.
- Logo: copiar `presupuestos/generador/logo-mcp.jpg` a `public/presupuesto-logo.jpg`.
- `next.config.mjs`: `experimental.serverComponentsExternalPackages: ['@react-pdf/renderer']`. La ruta usa
  `runtime = 'nodejs'`.

### API: patrón de `app/api/admin/conversations/[id]/activities/route.ts`
Ese patrón es: `requireAdmin` → `UUID_RE` → `getConversation(id, user)` para ver si puede acceder → db en try/catch.
- `app/api/admin/presupuestos/route.ts`: POST crea (body `{conversationId, data}`).
- `app/api/admin/presupuestos/[id]/route.ts`:
  - PATCH guarda; con `{marcarEnviado: true}` además setea `sent_at` y `conversations.amount = total`.
  - Al marcar enviado también llama a `addActivity(id, 'presupuesto', 'N° 2026-001 · $3.607.500', userId)`.
    Eso ya mueve el contacto a `presupuestado` (`STATUS_FOR_ACTIVITY` en `lib/db.ts`).
  - DELETE borra.
- `app/api/admin/presupuestos/[id]/pdf/route.ts`: GET con `Content-Disposition: attachment;
  filename="Presupuesto MCP - <cliente>.pdf"`.
- Wrappers en `lib/adminApi.ts`, con el mismo patrón que `send()`.

### UI admin
- `components/admin/PresupuestosBox.tsx`: tarjeta en el panel del contacto (`app/(admin)/admin/page.tsx`, entre
  `ContactDetails` ~l.243 y `ActivityLog` ~l.312, con el estilo `bg-white rounded-2xl border border-brand-border p-4`).
  - Lista número, fecha, total y estado (borrador/enviado).
  - Acciones: Editar · Descargar PDF · "Nuevo presupuesto".
  - `listPresupuestos` se suma al `Promise.all` de la página (l.76-84).
- `app/(admin)/admin/presupuesto/nuevo/page.tsx` (`?c=<id>`) y `app/(admin)/admin/presupuesto/[id]/page.tsx`.
  Son server components con `requireAdminPage()` y `AdminHeader`, como `admin/nuevo/page.tsx`.
- `components/admin/PresupuestoEditor.tsx` (client, pensado primero para celular):
  - Datos del cliente precargados del contacto (nombre, zona, proyecto). Cada fase es una tarjeta, y cada
    renglón tiene concepto + cantidad + precio (`inputMode="decimal"`), con "+ Agregar renglón" y quitar.
  - Subtotales y etapas en vivo con `calcular()`. Barra fija abajo con el total + Guardar.
  - Después de guardar: "Descargar PDF" y "Marcar como enviado".
  - Reutiliza `Input` de `ContactDetails.tsx`.

## Fase 2: PDF preliminar en la calculadora (reutiliza el dominio y el PDF de la Fase 1)

- `lib/crm.ts`: agregar `'calculadora'` a `LeadSource`, `LEAD_SOURCES` y `SOURCE_LABELS` ("Calculadora web").
  No va en `MANUAL_LEAD_SOURCES`.
- `lib/db.ts`: `createPublicLead(...)`, una variante de `createManualLead` (l.552) con `assigned_to null` y sin
  marcar como leído, para que aparezca como nuevo en el inbox.
- `app/api/presupuesto/route.ts` (público, fuera de `/api/admin`):
  - Valida nombre y teléfono, con un campo trampa oculto (honeypot) contra bots.
  - Límite por IP: `hashIp(clientIp(request))`, máximo 5 por hora, con una consulta de conteo como
    `countRecentConversations`.
  - **Recalcula los precios en el servidor** con `precioModulo` de `components/cocinas/data.ts`; nunca confía en
    el total que manda el navegador.
  - Crea el contacto y un presupuesto `kind = 'preliminar'`, avisa con `notifyPhoneLead` (`lib/notify.ts`) y
    devuelve `{id}`.
- `app/api/presupuesto/[id]/pdf/route.ts`: GET con el uuid (no se puede adivinar) que devuelve el PDF
  preliminar (`inline`, para que los navegadores internos lo muestren).
- `components/cocinas/Calculadora.tsx`, en la columna de resumen (l.231-283):
  - Debajo del botón de WhatsApp (que sigue siendo el principal) va un botón secundario
    "Descargar presupuesto en PDF". Abre un mini formulario (nombre, WhatsApp, honeypot) → POST → navega a la URL del PDF.
  - Evento GA `generate_lead` con `placement: 'cocinas_calculadora_pdf'`, igual que `trackWhatsAppClick` en
    `lib/useWhatsAppCTA.ts`.
  - El nombre y el teléfono nunca van en la URL.

## Archivos críticos

- **Nuevos:**
  - `lib/presupuesto.ts`
  - `components/pdf/PropuestaPdf.tsx`
  - `components/admin/PresupuestosBox.tsx`
  - `components/admin/PresupuestoEditor.tsx`
  - `app/(admin)/admin/presupuesto/{nuevo,[id]}/page.tsx`
  - `app/api/admin/presupuestos/**`
  - `app/api/presupuesto/**`
  - `public/presupuesto-logo.jpg`
- **Se modifican:**
  - `db/schema.sql`
  - `lib/db.ts`
  - `lib/crm.ts`
  - `lib/adminApi.ts`
  - `app/(admin)/admin/page.tsx`
  - `components/cocinas/Calculadora.tsx`
  - `next.config.mjs`
  - `package.json`
- Plan y revisión en `tasks/presupuestos.md`, con el mismo formato que `tasks/crm-completo.md`.

## Verificación (sin dev server: regla de CLAUDE.md)

1. **Cálculo:** script con `node --experimental-strip-types` que carga los datos de Natalia en `calcular()` y
   verifica total $3.607.500 y etapas 935.500 / 472.000 / 1.300.000 / 900.000. Es el mismo resultado que el Excel.
2. `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores.
3. **PDF:** una ruta o script que renderiza `PropuestaPdf` con los datos de Natalia y el preliminar a archivos.
   Después `pdftoppm` → hoja de contacto con ffmpeg → revisarlo a ojo contra el PDF de Natalia de hoy.
4. **De punta a punta:**
   - Deploy de **preview** en Vercel (rama propia) después de `db:push` (la tabla nueva es aditiva).
   - Playwright con `devices["iPhone 13"]` y un owner temporal `@e2e.test` (patrón de la memoria del CRM):
     crear presupuesto → guardar → descargar PDF → marcar enviado. Debe aparecer la actividad y el contacto
     pasa a "presupuestado".
   - En `/cocinas`: completar el formulario → se crea el contacto `calculadora` → el PDF abre → el límite de
     5/hora corta el sexto envío.
   - Revisar también que la página no tenga scroll horizontal.
   - Después borrar el owner, el contacto y el presupuesto de prueba.
5. Recién ahí se mergea a main / prod. Marcelo lo prueba con un presupuesto real.

---

## Estado (2026-10-28)

- [x] Paso 0: CRM pendiente commiteado aparte (`4475cd1`, local, sin push).
- [x] `lib/presupuesto.ts`: cálculo verificado con Natalia ($3.607.500; etapas 935.500 / 472.000 / 1.300.000 / 900.000).
- [x] `db/schema.sql`: tabla `presupuestos` + secuencia, aplicada en Neon el 2026-10-28.
- [x] PDF formal y preliminar (`components/pdf/`), revisados a ojo con Quick Look.
- [x] API admin, tarjeta en la ficha, editor `/admin/presupuesto/{nuevo,[id]}`.
- [x] Calculadora: formulario nombre + WhatsApp → `/api/presupuesto` → PDF.
- [x] `tsc` y `npm run build` sin errores. `npm run lint` no corre: el repo nunca configuró ESLint.
- [x] Preview (`vercel curl`): validaciones 400, rutas admin 401 sin sesión, preliminar creado y PDF 200 con
      precios recalculados en el servidor. En Vercel faltaban las fuentes de pdfkit (arreglado en `next.config.mjs`).
- [x] Merge a main, push y deploy a prod (2026-10-28, por la integración con Git).
- [x] Prod verificado: páginas, redirect de /admin, validaciones 400, rutas admin 401, PDF 200 con no-store,
      y el formulario de `/cocinas` en iPhone 13 (Playwright) sin scroll horizontal.
- [x] Contacto de prueba borrado y `presupuesto_numero_seq` reiniciada: el primero real sale 2026-001.
- [x] Bug encontrado al verificar: prod seguía sirviendo el PDF ya borrado. Next 14 cacheaba los fetch POST del
      driver de Neon en los GET de route handlers (aun con force-dynamic). Arreglado en `db()` con
      `fetchOptions: { cache: 'no-store' }` (`1c8fdca`); ahora da 404. Afectaba también al export CSV.
- [ ] Desde la red de Matías, conectar a la IP de `www.mcpmuebles.com` (216.198.79.1) tarda ~15 s; la de
      `mcpmuebles.com` (64.29.17.1) responde al instante. Probar desde el celular con datos móviles.
- [x] Editor del panel probado en prod con la sesión de Matías (navegador integrado): alta de contacto →
      presupuesto con los datos de Natalia ($3.607.500, mismas etapas que el Excel) → guardado N° 2026-001 →
      PDF del panel 200 (la ruta pública da 404 para el formal) → "Marcar enviado" dejó monto, actividad y
      estado Presupuestado. Vista 375 px sin scroll horizontal. Datos de prueba borrados y numeración en 2026-001.
