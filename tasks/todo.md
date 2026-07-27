# Plan: Dominar tráfico orgánico + Atribución de leads — MCP Muebles Santa Fe

Objetivo comercial: generar ventas de cocinas vía SEO y poder **probar la atribución**
para cobrar comisión sobre venta. Ticket ~$1k USD/cocina.

Estado actual del repo (relevado 2026-07-27):
- Next.js App Router, 2 páginas: `/` y `/proyecto-cocina`.
- Metadata solo en `app/layout.tsx`, compartida para todo. Sin per-page, sin canonical, sin metadataBase.
- SIN `sitemap`, SIN `robots`, SIN JSON-LD, SIN OG image. Fotos en PNG pesado.
- GA + Google Ads + Clarity ya cargados (`lib/constants.ts`).
- Atribución: `trackWhatsAppClick`/`trackChatbotOpen` disparan eventos + conversión Ads.
  El link de WhatsApp mete "Referencia web: {path}{query}" (solo página actual).
- Chatbot `/api/chat` = relay a OpenAI. NO recibe ni guarda origen ni datos del lead.
- No hay cierre de loop lead -> venta.

---

## ETAPA 1 — Captar y dominar el tráfico orgánico de Google (SEO local)

### 1.1 Fundaciones técnicas (código, en el repo)
- [ ] `app/robots.ts` (permitir + apuntar al sitemap)
- [ ] `app/sitemap.ts` (todas las URLs indexables)
- [ ] `metadataBase` + metadata única por página (title/description propios de cada page) + canonical
- [ ] JSON-LD (Structured Data):
  - [ ] `LocalBusiness` / `HomeAndConstructionBusiness`: NAP, geo Santa Fe, horarios, priceRange, `sameAs` a IG/FB
  - [ ] `Product` + `Offer` para cocinas (con precio desde $660.000)
  - [ ] `FAQPage` reutilizando las FAQ de `/proyecto-cocina`
  - [ ] `BreadcrumbList`
- [ ] OG image (`og.png`) para compartir en redes/WhatsApp
- [ ] Core Web Vitals: pasar fotos PNG -> `next/image` con WebP/AVIF + lazy load (hoy pesan mucho, penaliza ranking mobile)

### 1.2 Local SEO (la palanca real para negocio local)
- [ ] Google Business Profile: reclamar/optimizar — categorías, área de servicio Santa Fe, fotos reales de cocinas, horarios, descripción
- [ ] Motor de reseñas: pedir reseña de Google a CADA cliente cerrado (mayor palanca de ranking + confianza)
- [ ] Posts semanales en GBP + sección Q&A
- [ ] Citations / directorios AR con NAP consistente (mismo nombre/dirección/teléfono en todos lados)

### 1.3 Contenido y expansión de keywords
- [ ] Mapa de keywords: "cocinas a medida santa fe", "muebles de cocina santa fe",
      "amoblamientos de cocina", "reforma de cocina santa fe", "bajo mesada",
      "alacenas a medida", "cocinas melamina egger", variantes por material/barrio
- [ ] Páginas SEO nuevas: por tipo (lineal, en L, con isla/barra), por material, casos/proyectos
- [ ] Aprovechar `/proyecto-cocina` (guía+precios+FAQ) como pilar y linkear internamente

### 1.4 Medición SEO
- [ ] Google Search Console: verificar dominio, subir sitemap, monitorear queries/posición/impresiones
- [ ] GA4: segmento/reporte de canal Organic Search aislado

---

## ETAPA 2 — Atribución correcta con el bot y los leads (para cobrar comisión)

Gap actual: no se persiste el origen first-touch; los leads del chatbot no tienen origen;
no hay cierre hasta la venta. Sin esto, la comisión es tu palabra vs la de él.

- [ ] **Captura first-touch**: al primer landing leer UTMs + `gclid` + `referrer` y guardar
      en cookie first-party / localStorage (source, medium, campaign, gclid, landing, timestamp).
      Persistir entre páginas y sesiones.
- [ ] **Pasar origen a WhatsApp**: mejorar el mensaje para incluir el origen first-touch guardado
      (organic / google-ads / meta / directo) — que Marcelo vea de dónde vino cada consulta.
- [ ] **Lead capture en el chatbot**: cuando el chat se vuelve lead (bot pide nombre + teléfono),
      hacer POST del contacto + atribución a un store (Sheet/DB/webhook). Cada lead etiquetado con origen.
- [ ] **GA4 `generate_lead`**: disparar con params de origen; separar lead-atribuido-orgánico
      vs lead-atribuido-pago. Marcar conversión de Google Ads SOLO si hay `gclid`
      (para no atribuir leads orgánicos a Ads y viceversa).
- [ ] **Cierre de loop lead -> venta**: Sheet/CRM liviano donde Marcelo marca lead -> venta (monto).
      Esto es lo que habilita facturar la comisión. Opcional: import de conversiones offline a Ads.
- [ ] **Dashboard**: Looker Studio conectando GA4 + Sheet -> leads por origen, ventas por origen,
      comisión atribuible del mes.

---

## Orden sugerido de ejecución
1. Etapa 1.1 (fundaciones técnicas) + Search Console — arranca la indexación ya.
2. Etapa 2 (atribución) — antes de meter presupuesto de contenido, para medir todo desde el día 1.
3. Etapa 1.2 (GBP + reseñas) — mayor ROI local, en paralelo.
4. Etapa 1.3 (contenido) — el trabajo de mediano plazo.

## Review

### Etapa 1.1 — Fundaciones técnicas SEO (completada 2026-07-27)
Build verificado (`npm run build` OK, 9/9 páginas, sin errores de tipos).
- `app/robots.ts` + `app/sitemap.ts` (dominio https://www.mcpmuebles.com).
- `SITE_URL` en `lib/constants.ts`.
- Layout: `metadataBase`, `alternates.canonical`, `openGraph` (url/siteName), `twitter` card.
- `/proyecto-cocina`: canonical propio.
- JSON-LD: `lib/structuredData.ts` (HomeAndConstructionBusiness con NAP+geo+horarios,
  Product/Offer $660.000, FAQPage, BreadcrumbList) + `components/JsonLd.tsx`.
  FAQ extraídas a `lib/faqData.ts` (single source of truth, usadas por UI y JSON-LD).
- OG image dinámica: `app/opengraph-image.tsx` (next/og, 1200x630).
- Imágenes: 7 componentes migrados de `<img>` a `next/image` (fill + sizes + WebP/AVIF
  automático; hero con `priority` para LCP; logo con import estático).

### Etapa 2 — Atribución con el bot (completada 2026-07-27)
Build verificado (`npm run build` OK, 10/10 páginas, `/api/lead` como ruta).
- `lib/attribution.ts`: captura first-touch (UTMs+gclid+referrer), clasifica
  source/medium (orgánico/cpc/social/referral/directo), cookie `mcp_attr` 90d,
  `getOriginLabel()` legible en castellano.
- `components/AttributionTracker.tsx` montado en el layout: captura al entrar.
- `buildWhatsAppUrl` ahora agrega línea "Origen: {label}"; `useWhatsAppCTA` lee la
  atribución y la pasa. Marcelo ve el origen en CADA mensaje de WhatsApp.
- GA4 `generate_lead` (con lead_source/medium/campaign/gclid) al hacer click en
  cualquier CTA de WhatsApp (además del `whatsapp_click` y la conversión de Ads ya existentes).
- `app/api/lead/route.ts`: valida/limita y reenvía el lead a `LEAD_WEBHOOK_URL`
  (si no está seteada, lo loguea). `lib/lead.ts`: `postLead`, `detectPhone`, `trackChatbotLead`.
- `ChatWidget`: detecta teléfono en el chat → postea lead (contacto + atribución +
  transcript) una sola vez + dispara `generate_lead` (lead_type: chatbot).
- System prompt: agregada opción de tomar nombre+teléfono en el chat para quien
  prefiere que lo contacten (secundario a WhatsApp/videollamada).

### Pendiente manual (requiere cuentas del cliente / Matias)
- [ ] Setear `LEAD_WEBHOOK_URL` en Vercel apuntando a un Google Apps Script / Zapier
      que escriba en el Sheet de leads (cierre de loop lead -> venta).
- [ ] GA4: marcar `generate_lead` como conversión / evento clave.
- [ ] Search Console: verificar dominio + subir sitemap.
- [ ] Datos para enriquecer JSON-LD: URLs de Instagram/Facebook (`sameAs`) y dirección de calle.
- [ ] Dashboard Looker Studio (GA4 + Sheet): leads y ventas por origen.
- [ ] Etapa 1.2 (GBP + reseñas) y 1.3 (contenido).
