// Precios y condiciones de MCP. Los usan el chat de la web y el bot de WhatsApp.
// Los números salen de lib/precios.mjs, la misma lista que la calculadora de
// /cocinas: los bots cotizan igual que la web. Es .mjs para que también lo lea
// db/kapso-setup.mjs, que corre sin compilar.

import {
  ADICIONALES,
  EXTRAS,
  MESADAS,
  PILETAS,
  PLACARES,
  PRECIO_ML_BAJO_MESADA,
  TOPE_DE_GAMA,
  pesos,
  precioModulo,
} from './precios.mjs'

// De 0,60 a 3,00 m cada 20 cm; entre dos medidas el bot toma la más cercana.
// Son los mismos números que la calculadora, que interpola cada 10 cm.
const MEDIDAS = Array.from({ length: 13 }, (_, i) => 60 + i * 20)

/** @param {'estandar' | 'premium'} linea @param {'alacena'} modulo */
const tabla = (linea, modulo) =>
  MEDIDAS.map(
    (largo) => `${(largo / 100).toFixed(2).replace('.', ',')} m ${pesos(precioModulo(linea, modulo, largo))}`
  ).join(' · ')

export const DATOS_MCP = `# Datos de MCP (usalos, no inventes otros)
Una cocina se cotiza por módulos que se suman: bajo mesada + alacena + mesada, más la pileta y los adicionales si los quiere. El cliente elige cuáles necesita. Una cocina en L o en U se cotiza sumando cada lado por separado (por ejemplo, bajo mesada 3,50 m + 2,70 m).

## Líneas
- Económica: aglomerado con 1 cajón incluido. Se entrega a domicilio en Santa Fe y la coloca el cliente (sin colocación).
- Estándar (la más pedida): los mismos módulos y el mismo material que la Económica, más asesoramiento de diseño y ajuste final en obra. La colocación profesional es a convenir y se cotiza aparte.
- Premium: MDF Egger importado, correderas de extracción total, manijas de aluminio negro anodizado, cambio de color a elección, toma de medidas en la casa y colocación profesional incluida.
- Tope de Gama: el mueble de la Premium (MDF Egger, colocación incluida) con todo el equipamiento, que se suma al precio: colores a elección (${TOPE_DE_GAMA.colores.join(', ')}); perfil Gola sin manijas ${pesos(TOPE_DE_GAMA.gola.precioTira)} cada ${TOPE_DE_GAMA.gola.metrosTira} m de bajo mesada; correderas con cierre suave ${pesos(TOPE_DE_GAMA.precioCajon)} por cajón; luces LED ${pesos(TOPE_DE_GAMA.led.precioTira)} cada ${TOPE_DE_GAMA.led.metrosTira} m de alacena; 1 puerta vidriada con luz LED incluida sin cargo; cubertero y porta residuos incluidos (se cobran a precio de adicional).

## Bajo mesada (por metro lineal)
Económica ${pesos(PRECIO_ML_BAJO_MESADA.economica)}/ml · Estándar ${pesos(PRECIO_ML_BAJO_MESADA.estandar)}/ml · Premium y Tope de Gama ${pesos(PRECIO_ML_BAJO_MESADA.premium)}/ml

## Alacena (precio según el largo)
- Económica y Estándar: ${tabla('estandar', 'alacena')}
- Premium y Tope de Gama: ${tabla('premium', 'alacena')}

## Mesada (según el material, igual para todas las líneas)
${MESADAS.map((m) =>
  m.porMetro
    ? `- ${m.nombre}: ${pesos(m.porMetro)} el metro lineal`
    : m.medidas
      ? `- ${m.nombre} (${m.detalle.toLowerCase()}): ${Object.entries(m.medidas)
          .map(([largo, precio]) => `${(Number(largo) / 100).toFixed(2).replace('.', ',')} m ${pesos(precio)}`)
          .join(' · ')}`
      : `- ${m.nombre}: precio a consultar con Marcelo`
).join('\n')}

## Piletas de acero inoxidable (aparte de la mesada, por unidad)
${PILETAS.map((p) => `${p.nombre} ${pesos(p.precio)}`).join(' · ')}

## Adicionales (Económica, Estándar y Premium; en Tope de Gama ya vienen)
${ADICIONALES.map((a) => `${a.nombre} ${pesos(a.precio)}`).join(' · ')} · ${EXTRAS.led.nombre} ${pesos(EXTRAS.led.precioTira)} cada ${EXTRAS.led.metrosTira} m de alacena · ${EXTRAS.puertaVidrio.nombre} ${pesos(EXTRAS.puertaVidrio.precio)} por puerta

## Placares (precio por metro cúbico)
${pesos(PLACARES.precioM3)} por m³. Los m³ salen de ancho × alto × profundidad, en metros. Ejemplo: 2,00 m de ancho × 2,40 m de alto × 0,60 m de profundidad = 2,88 m³ × ${pesos(PLACARES.precioM3)} = ${pesos(Math.round(2.88 * PLACARES.precioM3))}. Si no sabe el alto, usá 2,40 m; si no sabe la profundidad, 0,60 m (lo común para colgar ropa). Es un precio de referencia: se ajusta con las medidas exactas en obra, el tipo de puerta (batiente o corrediza), la distribución interior y las terminaciones. La calculadora está en https://www.mcpmuebles.com/placares

## Condiciones
- Siempre incluye: fabricación a medida, cantos termofusionados, ajuste final de puertas y cajones, limpieza final.
- No incluye: pileta (salvo que la elija aparte o la mesada sintética estándar, que trae bacha simple), grifería, electrodomésticos, electricidad, plomería, pintura o revestimientos, retiro de los muebles viejos.
- Plazo: 15 a 20 días hábiles de fabricación desde que se confirma el presupuesto; la colocación se hace en un día.
- Garantía escrita: 12 meses sobre herrajes y estructura.
- Pago: por etapas; se abonan los materiales para arrancar y el resto en cuotas acordadas con Marcelo. Sin financiación bancaria.
- Zona: Santa Fe Capital y alrededores (Santo Tomé, Recreo, Rincón). Más lejos depende del proyecto: lo ve Marcelo.`

// Los pasos de cotización que comparten los dos bots.
export const PASOS_COTIZAR = `1. Si no lo dijo, preguntá qué necesita: bajo mesada, alacena, mesada o la cocina completa.
2. Pedí el largo de cada módulo en metros; si la cocina es en L o en U, el largo de cada lado. Preguntá qué línea le interesa; si no sabe, sugerí Estándar.
3. Calculá cada módulo por separado con los datos de arriba y sumalos: el bajo mesada es metros × precio por ml; la alacena sale de su tabla con la medida más cercana, lado por lado; la mesada según el material. Sumá la pileta, los adicionales y, en Tope de Gama, su equipamiento. Nunca cobres la alacena ni la mesada al precio del bajo mesada.
4. Presentá el total redondeado como orientativo, con el detalle por módulo en una línea (por ejemplo: "bajo mesada 2 m $720.000 + alacena 1,60 m $354.779, unos $1.075.000 en línea Estándar"). Decí qué pasa con la colocación en esa línea, y aclará SIEMPRE que el precio exacto sale del relevamiento del espacio.
5. Para placards: pedí ancho, alto y profundidad, calculá los m³ y multiplicá por el precio del m³ (ver Placares). Mostrá la cuenta (por ejemplo: "2 × 2,40 × 0,60 = 2,88 m³, unos $2.304.000") y aclará que es de referencia. Podés pasarle la calculadora de placares.
6. Para vestidores, muebles de baño u otros muebles no hay lista: tomá los datos y decí que los cotiza Marcelo.`
