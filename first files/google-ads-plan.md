# Google Ads Plan - MCP Muebles Santa Fe

**Fecha:** 11 de abril de 2026
**Cliente:** MCP Muebles (Marcelo) - Santa Fe, Argentina
**Objetivo:** Generar leads calificados via WhatsApp para cocinas a medida
**Sitio:** www.mcpmuebles.com

---

## 1. Diagnostico de la situacion actual

### Performance general (1 Feb - 11 Abr 2026)

| Metrica | Valor |
|---|---|
| Clicks totales | 820 |
| Impresiones | 12,000 |
| CTR promedio | 6.66% |
| CPC promedio | ARS $213.06 |
| Campanas activas | 3 |

### Campanas actuales

| Campana | Clicks | Impr. | CTR | CPC prom. | Estado |
|---|---|---|---|---|---|
| MCP Muebles \| Busqueda \| Santa Fe | 699 | 10,706 | 6.53% | ~$230 | Activa |
| Presupuestador Cocinas SantaFe 2026 | 85 | 1,078 | 7.88% | $91.97 | **No apta** |
| Mesadas - MCP - Santa Fe | 36 | 526 | 6.84% | — | Activa |

### Problemas detectados

1. **Presupuestador marcada "No apta"** — La campana con mejor CTR (7.88%) y menor CPC ($91.97) esta inhabilitada. Esto es la prioridad #1. Causas posibles:
   - Presupuesto agotado o pausado
   - Problema con la URL final o landing page
   - Violacion de politicas de Google Ads
   - Metodo de pago rechazado

2. **Trafico cayendo a cero** — El grafico de rendimiento muestra que los clicks/impresiones del Presupuestador cayeron a cero alrededor del 5-8 de abril. Coincide con el estado "No apta".

3. **CPC alto en campana principal** — La campana principal tiene un CPC ~2.5x mas alto que el Presupuestador. Las keywords son mas genericas y competidas.

4. **Sin tracking de conversiones visible** — No se ven datos de conversiones en los screenshots. Sin esto, no podemos optimizar por costo por lead.

5. **Mesadas muy chica** — Solo 36 clicks en 2+ meses. O el volumen de busqueda es bajo, o la campana necesita mas keywords/presupuesto.

---

## 2. Acciones inmediatas (esta semana)

### 2.1 Resolver "No apta" en Presupuestador
- [ ] Entrar a Google Ads > Campana Presupuestador > revisar la columna "Estado" para ver el motivo exacto
- [ ] Si es presupuesto: reasignar budget de la campana principal
- [ ] Si es landing page: verificar que la URL del Presupuestador carga correctamente en mobile
- [ ] Si es politica: revisar los anuncios rechazados y corregir

### 2.2 Configurar tracking de conversiones
- [ ] Implementar conversion de click en boton WhatsApp (evento de Google Ads o GA4)
- [ ] Opciones:
  - **Google Ads tag** en el click del boton WhatsApp (mas simple)
  - **GA4 event** importado a Google Ads (mas flexible)
- [ ] Esto es critico — sin conversiones no podemos medir costo por lead ni usar Smart Bidding

### 2.3 Revisar landing pages en mobile
- [ ] Testear las 3 landings en celular (83% del trafico es mobile)
- [ ] Verificar que el boton WhatsApp funciona correctamente en Android/iOS
- [ ] Medir velocidad de carga (PageSpeed Insights)

---

## 3. Estrategia de campanas propuesta

### Estructura recomendada: 4 campanas

```
Cuenta MCP Muebles
├── 1. Cocinas a Medida - Santa Fe (Search) ← campana principal reformulada
├── 2. Presupuestador - Cocinas (Search) ← reactivar y escalar
├── 3. Mesadas de Granito - Santa Fe (Search) ← mantener como nicho
└── 4. Remarketing - Display (nuevo)
```

---

### Campana 1: Cocinas a Medida - Santa Fe (Search)

**Objetivo:** Captar busquedas de alta intencion de compra
**Landing page:** LP1 (dark/elegant) o LP3 (presupuestador verde) — testear cual convierte mejor
**Presupuesto sugerido:** 60% del total

#### Grupo de anuncios A: Cocinas a medida (alta intencion)

**Keywords:**
| Keyword | Concordancia | Intencion |
|---|---|---|
| cocinas a medida santa fe | Frase | Alta |
| muebles de cocina a medida santa fe | Frase | Alta |
| amoblamientos de cocina santa fe | Frase | Alta (12% CTR actual) |
| fabrica de muebles de cocina santa fe | Frase | Alta |
| carpinteria cocinas santa fe | Frase | Alta |
| bajo mesada a medida santa fe | Frase | Alta |
| cocina a medida precio santa fe | Frase | Alta |

**Anuncio RSA sugerido:**

Titulos (15):
1. Cocinas a Medida en Santa Fe
2. Fabricamos Tu Cocina Ideal
3. 20 Anos de Experiencia
4. 481 Cocinas Instaladas
5. Diseno 3D Antes de Fabricar
6. Medicion Gratis en Tu Casa
7. Todo Incluido - Sin Sorpresas
8. Servicio Llave en Mano
9. Melamina Egger + Granito Natural
10. Presupuesto en el Dia
11. Pagos por Etapas
12. Instalacion por Equipo Propio
13. Bacha Johnson de Regalo
14. Desde $660.000 Todo Incluido
15. Marcelo Te Atiende Directo

Descripciones (4):
1. "Disenamos tu cocina en 3D con SketchUp. Medicion gratis, fabricacion a medida y instalacion completa. Escribinos por WhatsApp."
2. "481 cocinas instaladas en Santa Fe. Melamina Egger, mesada de granito natural, herrajes Grupo Euro. Presupuesto sin compromiso."
3. "Mandanos una foto y las medidas aproximadas. Te respondemos en el dia con precio. Sin reuniones, sin vueltas. Todo por WhatsApp."
4. "Cocina completa desde $660.000. Incluye bajo mesada, mesada de granito, bacha Johnson Z52 instalada. Pagos por etapas."

#### Grupo de anuncios B: Cocinas modernas / integrales (investigacion)

**Keywords:**
| Keyword | Concordancia |
|---|---|
| cocinas integrales modernas | Amplia modificada |
| cocinas modernas a medida | Frase |
| diseno de cocinas modernas | Amplia modificada |
| remodelacion cocina | Amplia modificada |

> Nota: estas keywords son mas genericas y mas caras (CTR 5.88% actual). Monitorear CPA y pausar si no convierten.

#### Negativas (aplicar a nivel de campana):

```
- cocina industrial
- cocina restaurante
- cocina electrica / gas / hornos
- cursos cocina
- recetas
- muebles usados
- muebles gratis
- empleo / trabajo carpinteria
- rosario / buenos aires / cordoba (otras ciudades)
- ikea
- sodimac
- easy
```

---

### Campana 2: Presupuestador - Cocinas (Search)

**Objetivo:** Captar gente que busca precios y presupuestos — buyer intent alto
**Landing page:** LP3 (presupuestador verde/negro) — la mas conversion-focused
**Presupuesto sugerido:** 25% del total

**Por que escalar esta campana:**
- Mejor CTR (7.88% vs 6.53%)
- Menor CPC ($91.97 vs ~$230)
- Landing page mas orientada a conversion (precio visible, CTA claros, social proof)

#### Keywords:

| Keyword | Concordancia |
|---|---|
| muebles de cocina precios | Frase |
| presupuesto cocina a medida | Frase |
| cocina a medida precio | Frase |
| cuanto sale una cocina a medida | Frase |
| precio muebles de cocina santa fe | Frase |
| bajo mesada precio | Frase |
| cocina completa precio | Frase |
| presupuesto cocina santa fe | Frase |

**Anuncio RSA sugerido:**

Titulos:
1. Cocina Completa Desde $660.000
2. Precio Final Sin Sorpresas
3. Presupuesto Gratis en el Dia
4. Cocina 2.40m por $2.276.000
5. Todo Incluido - Llave en Mano
6. Mandanos Foto y Te Cotizamos
7. Mesada de Granito Incluida
8. Bacha Johnson Z52 de Regalo
9. 481 Cocinas en Santa Fe
10. Pagos por Etapas

Descripciones:
1. "Cocina completa: bajo mesada Egger + mesada de granito + bacha Johnson Z52 instalada. Desde $660.000 todo incluido. Escribinos hoy."
2. "Mandanos una foto de tu cocina y las medidas aproximadas. Te respondemos en el dia con precio. Sin compromiso, sin reuniones."

---

### Campana 3: Mesadas de Granito - Santa Fe (Search)

**Objetivo:** Captar nicho especifico de mesadas
**Landing page:** LP2 (blue/purple cocina 2.40m) con scroll a seccion de especificaciones
**Presupuesto sugerido:** 10% del total

#### Keywords:

| Keyword | Concordancia |
|---|---|
| mesada de granito santa fe | Frase |
| mesada de granito precio | Frase |
| mesada cocina granito | Frase |
| mesada a medida santa fe | Frase |
| mesada de granito natural | Frase |
| cambiar mesada cocina | Frase |

**Consideracion:** Si el volumen sigue bajo despues de 30 dias con estas keywords, fusionar en la Campana 1 como un grupo de anuncios separado.

---

### Campana 4: Remarketing - Display (NUEVA)

**Objetivo:** Reimpactar a visitantes que no convirtieron (no escribieron por WhatsApp)
**Presupuesto sugerido:** 5% del total
**Requisito previo:** Tener la etiqueta de Google Ads instalada en todas las landing pages

#### Audiencias:
- Visitantes del sitio en los ultimos 30 dias
- Excluir convertidos (quienes clickearon WhatsApp)

#### Creatividades sugeridas:
- Banner con foto de cocina terminada + "Tu cocina nueva desde $660.000 - Consulta gratis"
- Banner con promo bacha Johnson + "Bacha Johnson de regalo este mes"
- Banner de urgencia: "Los turnos de instalacion se ocupan rapido"

---

## 4. Configuracion de segmentacion

### Ubicacion
- Santa Fe Capital
- Santo Tome
- Radio de 30km alrededor de Santa Fe ciudad

### Dispositivos
- Mobile: sin ajuste (ya es 83% del trafico, dejar que optimice solo)
- Desktop: sin ajuste
- Tablets: excluir o -100% (0% del trafico actual)

### Horarios (Ad Schedule)
- **Lunes a Viernes:** 7:00 - 21:00 (bid +20% de 10:00 a 18:00, hora pico)
- **Sabados:** 8:00 - 14:00 (bid normal)
- **Domingos:** pausar o bid -50% (bajo rendimiento observado)

### Demografia
- Edad: 25-65+ (mantener amplio, la data muestra distribucion pareja)
- Genero: todos
- Ingresos: si disponible, excluir el 10% inferior

---

## 5. Landing pages - Asignacion y mejoras

### Asignacion por campana

| Campana | Landing Page | URL sugerida |
|---|---|---|
| Cocinas a Medida | LP1 (dark/elegant) o LP3 (test) | mcpmuebles.com/cocinas-a-medida |
| Presupuestador | LP3 (green/black) | mcpmuebles.com/presupuesto |
| Mesadas | LP2 (blue/purple) | mcpmuebles.com/cocina-240 |
| Remarketing | LP3 (green/black) | mcpmuebles.com/presupuesto |

### Mejoras recomendadas en las landing pages

1. **Agregar UTM tracking a todos los links de WhatsApp** para diferenciar de que campana viene cada lead
   - Ejemplo: `?utm_source=google&utm_medium=cpc&utm_campaign=presupuestador`

2. **LP1 (dark/elegant):** Buena credibilidad pero le falta precio visible. Considerar agregar rango de precios en el hero para gente que busca cotizar.

3. **LP2 (blue/purple cocina 2.40m):** Muy especifica para un producto. Funciona bien para keywords de precio. Verificar que el boton WhatsApp funciona en mobile.

4. **LP3 (green/black presupuestador):** La mejor para conversion:
   - Precio visible ($660.000)
   - Promo clara (bacha de regalo)
   - Social proof (testimonios, 481 cocinas)
   - 3 pasos simples
   - CTA fuerte ("Quiero precio por WhatsApp")
   - **Recomendacion:** usar esta como landing principal para la mayoria de las campanas

---

## 6. Presupuesto y bidding

### Distribucion sugerida del presupuesto diario

Asumiendo un presupuesto diario total de ARS $3,000-5,000 (ajustar segun capacidad):

| Campana | % | Diario estimado |
|---|---|---|
| Cocinas a Medida | 60% | $1,800 - $3,000 |
| Presupuestador | 25% | $750 - $1,250 |
| Mesadas | 10% | $300 - $500 |
| Remarketing | 5% | $150 - $250 |

### Estrategia de bidding

| Campana | Bidding inicial | Migrar a (con data de conversiones) |
|---|---|---|
| Cocinas a Medida | Maximizar clics (con CPC maximo) | Maximizar conversiones |
| Presupuestador | Maximizar clics | Maximizar conversiones / Target CPA |
| Mesadas | CPC manual | Maximizar clics |
| Remarketing | Maximizar clics | Target CPA |

> **Importante:** Solo migrar a Smart Bidding (Maximizar conversiones / Target CPA) despues de tener al menos 30 conversiones en 30 dias. Antes de eso, usar Maximizar clics con CPC maximo para controlar costos.

---

## 7. Extensiones de anuncio (Assets)

### Sitelinks (ya existen, optimizar)
1. **Trabajos Realizados** — "Mira nuestras 481 cocinas instaladas" → /trabajos
2. **Precios** — "Cocina completa desde $660.000" → /precios
3. **Como Funciona** — "3 pasos, sin vueltas" → /como-funciona
4. **Formas de Pago** — "Pagos por etapas, sin adelantos grandes" → /pagos

### Callouts (agregar)
- "Medicion gratis"
- "Respuesta en el dia"
- "20 anos de experiencia"
- "Sin subcontratos"
- "Diseno 3D previo"
- "Instalacion completa"

### Structured snippets
- Tipo: "Servicios"
- Valores: "Diseno 3D", "Fabricacion a medida", "Instalacion completa", "Mesadas de granito", "Medicion en obra"

### Imagen (nuevo)
- Subir fotos de cocinas terminadas como extension de imagen
- Alta prioridad en mobile donde las imagenes se muestran prominentemente

### Llamada
- Agregar extension de llamada si Marcelo puede recibir llamadas, o redirigir a WhatsApp

---

## 8. Plan de testing (A/B)

### Mes 1: Abril-Mayo 2026

| Test | Que se prueba | Metrica clave |
|---|---|---|
| Landing page | LP1 vs LP3 para campana principal | Tasa de conversion (clicks a WhatsApp) |
| Ad copy | Headlines con precio vs sin precio | CTR |
| Keywords | Frase vs Amplia modificada para "cocinas modernas" | CPC + conversion rate |
| Horarios | Con ad schedule vs sin ad schedule | CPA |

### Mes 2-3: Optimizacion

- Pausar keywords con CPC alto y 0 conversiones despues de 50+ clicks
- Escalar budget en campanas/grupos con mejor CPA
- Agregar keywords de search terms que convirtieron
- Expandir negativas basado en search terms report

---

## 9. KPIs y objetivos

### Metricas a trackear semanalmente

| Metrica | Objetivo |
|---|---|
| CTR | >7% (mantener nivel actual) |
| CPC promedio | <$150 (bajar del actual $213) |
| Conversiones (clicks WhatsApp) | Establecer baseline en mes 1 |
| Costo por lead | Establecer baseline, luego reducir 20% en 3 meses |
| Impression share | >60% en keywords core de Santa Fe |

### Reporte semanal minimo
1. Clicks / impresiones / CTR por campana
2. CPC promedio por campana
3. Conversiones y CPA (una vez configurado)
4. Search terms relevantes nuevos
5. Search terms negativos nuevos para agregar

---

## 10. Checklist de implementacion

### Semana 1 (11-18 Abril)
- [ ] Diagnosticar y resolver estado "No apta" de Presupuestador
- [ ] Instalar tag de conversion en boton WhatsApp (todas las landing pages)
- [ ] Revisar y limpiar keywords negativas en las 3 campanas
- [ ] Testear las 3 landing pages en mobile (velocidad + UX)
- [ ] Agregar UTM parameters a todos los links de WhatsApp

### Semana 2 (18-25 Abril)
- [ ] Reestructurar campana principal con los 2 grupos de anuncios propuestos
- [ ] Crear nuevos anuncios RSA con los titulos/descripciones sugeridos
- [ ] Configurar ad schedule (horarios)
- [ ] Agregar extensiones faltantes (callouts, structured snippets, imagenes)
- [ ] Implementar lista de keywords negativas completa

### Semana 3 (25 Abr - 2 Mayo)
- [ ] Evaluar primeras conversiones y ajustar CPC maximos
- [ ] Revisar search terms report y agregar negativas
- [ ] Configurar campana de Remarketing Display
- [ ] Primer A/B test: LP1 vs LP3 en campana principal

### Mes 2+ (Mayo en adelante)
- [ ] Migrar a Smart Bidding si hay suficientes conversiones (30+)
- [ ] Escalar presupuesto en campanas con mejor CPA
- [ ] Evaluar si fusionar o mantener campana Mesadas
- [ ] Considerar Performance Max una vez que haya data de conversion solida
