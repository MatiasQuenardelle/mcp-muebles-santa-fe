# Sistema de gestión sobre `/admin` (2026-11)

Plan aprobado: obras, plata, compras, equipo, tablero y asistente IA sobre el panel de MCP.

## Avance

- [x] Fase 0: esquema, fórmulas, reportes, navegación, UI compartida y protecciones
- [x] Fase 1: los 6 módulos
- [x] Fase 2: integración, preview y verificación (ver Revisión)
- [x] Commit en la rama `gestion`
- [ ] OK de Matías para migrar producción y desplegar
- [ ] Fase 3: carga inicial y guía para Marcelo
- [ ] Fase 4: bot de WhatsApp → contactos (cuando el bot esté activo con el número nuevo)

## Reglas para quien construye un módulo (Fase 1)

La carpeta del repo termina en un espacio: `/Users/matiasquenardelle/GitHub/MCP Muebles Santa Fe /`. La app está en `mcp-landing/`.

**Prohibido**
- Editar fuera de tus archivos. Otros agentes escriben a la vez en el mismo checkout.
- Tocar `db/schema.sql`, `lib/gestion/{calculos,entrada,tipos,reportes,movimientos,opciones,nav}.ts`, `components/admin/gestion/*`, `lib/adminApi.ts`, `lib/db.ts`, `lib/crm.ts`. Si te falta una columna o un cambio ahí, no lo rodees: terminá lo demás y decilo en tu informe.
- Correr git, `next build`, `next dev`, `npm install` o cualquier servidor.
- Conectarte a la base de producción o modificar datos.

**Para chequear**: `npx tsc --noEmit --incremental false 2>&1 | grep -E '<tus rutas>'` desde `mcp-landing/`. Los errores en archivos de otros módulos no son tuyos.

**Reutilizá, no recalcules**
- Fórmulas: `lib/gestion/calculos.ts`. Ningún monto derivado (saldo, costo, margen, comisión, deuda) se calcula en otro lado.
- Lecturas: `REPORTES`, `obrasConResumen()` y `proveedoresConCuenta()` de `lib/gestion/reportes.ts`, `listarMovimientos()` de `lib/gestion/movimientos.ts`, `opcionesMovimiento()` de `lib/gestion/opciones.ts`.
- Escritura de plata: solo `registrarMovimiento()` y `anularMovimiento()`.
- Validación: los parsers de `lib/gestion/entrada.ts`; `InputError` se responde con 400.
- UI: `components/admin/gestion/ui.tsx` (`Panel`, `Tile`, `Empty`, `Bar`, `Campo`, clases `CLASE_*`), `MoneyInput`, `MovimientoForm` (con `claveFija`, `preset`, `bloquear`), `ListaMovimientos`. Fechas y plata con `formatMoney`, `todayKey` de `lib/adminFormat.ts`.
- Cliente: importá `send` de `lib/adminApi.ts` y escribí tus wrappers dentro de tus componentes.

**Patrones**
- Página: `export const dynamic = 'force-dynamic'`, `metadata` con título `... · Panel MCP`, primero `requireAdminPage()` o `requireOwnerPage()`, y `<main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">` con `<AdminHeader title subtitle />`. Formularios con `max-w-2xl`. Mirá `app/(admin)/admin/inicio/page.tsx` y `presupuesto/nuevo/page.tsx`.
- API: `requireAdmin` / `requireOwner` de `lib/session.ts` primero (401 / 403), UUID validado, `request.json().catch(() => null)`, `try` con `InputError` → 400 y `console.error` + 500. Mirá `app/api/admin/presupuestos/[id]/route.ts`.
- SQL: `db()` de `lib/db.ts` con tagged template o `sql.query`; cast `::float8` en plata, `::text` en fechas, `::int` en conteos, `::uuid` en parámetros. `sql.transaction([...])` es un lote: no se puede leer y decidir adentro.
- Plata solo para dueños: páginas con `requireOwnerPage`, API con `requireOwner`. A un no dueño nunca le viajan cobros, costos, márgenes ni comisiones: columnas explícitas, no filtrar en el cliente.

**Diseño**: es una app de celular. Mirá a 375 px: `grid-cols-1`, `min-w-0`, sin scroll horizontal, controles táctiles (nada que dependa de arrastrar o de hover), `text-base` en campos, `<select>` nativo, `type="date"`. Tokens `brand-*` de `tailwind.config.ts`, títulos `font-serif`. Estados vacíos que digan qué cargar primero.

**Texto**: español rioplatense, con voseo, como el resto del panel. Comentarios en español y solo cuando expliquen un porqué.

**Al terminar** informá archivos creados, salida de `tsc` para tus rutas, y lo que no hiciste o necesitás que cambie en los cimientos.

## Revisión (2026-11-09)

Verificado contra un preview de Vercel apuntado a una rama de Neon (`gestion-pruebas`), sin tocar producción:

- `npm test`: 25 de 25, fórmulas y parsers.
- Conciliación con cifras a mano sobre SQL real: anticipo a proveedor, un pago para varias compras, cobro de más, devolución, obra cancelada, movimiento anulado, transferencia, familia y doble toque. Con saldos iniciales en cero, la caja da exactamente la ganancia neta libre.
- Playwright en iPhone 13: 239 de 239. 26 pantallas sin errores ni scroll horizontal, venta completa por la interfaz (contacto ganado → obra → etapa → cobro → compra → pago), altas y cambios reales de cada módulo, protecciones 409 y permisos de empleado.
- Asistente con OpenAI real: las 6 preguntas del cliente coinciden con los reportes.

Lo que encontró la prueba y se corrigió:

- `gpt-4o-mini` sumaba los márgenes de las obras y mezclaba deuda con pedidos sin recibir, pese a la regla del prompt. Ahora `cifrasSinRespaldo` compara cada monto contra los reportes y, si alguno no sale de ahí, se muestra el reporte tal cual.
- `React.cache` no existe en route handlers: `reportes.ts` no cargaba fuera de un render.
- Un presupuesto de una obra cancelada quedaba bloqueado: el índice único ahora excluye las canceladas.

Sin verificar: comportamiento real en un iPhone (teclado, `<datalist>`), y el bot de WhatsApp (Fase 4).

Para migrar: `npm run db:push` desde `mcp-landing/` y deploy a producción. El esquema es aditivo. Los montos de gastos fijos vienen de la planilla y su frecuencia está sin confirmar.
