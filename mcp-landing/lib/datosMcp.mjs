// Precios y condiciones de MCP. Los usan el chat de la web y el bot de WhatsApp.
// Los números salen de lib/precios.mjs, la misma lista que la calculadora de
// /cocinas: los bots cotizan igual que la web. Es .mjs para que también lo lea
// db/kapso-setup.mjs, que corre sin compilar.

import { PRECIO_ML_BAJO_MESADA, pesos, precioModulo } from './precios.mjs'

// De 0,60 a 3,00 m cada 20 cm; entre dos medidas el bot toma la más cercana.
// Son los mismos números que la calculadora, que interpola cada 10 cm.
const MEDIDAS = Array.from({ length: 13 }, (_, i) => 60 + i * 20)

/** @param {'estandar' | 'premium'} linea @param {'alacena' | 'mesada'} modulo */
const tabla = (linea, modulo) =>
  MEDIDAS.map(
    (largo) => `${(largo / 100).toFixed(2).replace('.', ',')} m ${pesos(precioModulo(linea, modulo, largo))}`
  ).join(' · ')

export const DATOS_MCP = `# Datos de MCP (usalos, no inventes otros)
Una cocina se cotiza por módulos que se suman: bajo mesada + alacena + mesada. El cliente elige cuáles necesita.

## Líneas
- Económica: aglomerado con 1 cajón incluido. Se entrega a domicilio en Santa Fe y la coloca el cliente (sin colocación).
- Estándar (la más pedida): los mismos módulos y el mismo material que la Económica, más asesoramiento de diseño y ajuste final en obra. La colocación profesional es a convenir y se cotiza aparte.
- Premium: MDF Egger importado, correderas de extracción total, manijas de aluminio negro anodizado, cambio de color a elección, toma de medidas en la casa y colocación profesional incluida.

## Bajo mesada (por metro lineal)
Económica ${pesos(PRECIO_ML_BAJO_MESADA.economica)}/ml · Estándar ${pesos(PRECIO_ML_BAJO_MESADA.estandar)}/ml · Premium ${pesos(PRECIO_ML_BAJO_MESADA.premium)}/ml

## Alacena (precio según el largo)
- Económica y Estándar: ${tabla('estandar', 'alacena')}
- Premium: ${tabla('premium', 'alacena')}

## Mesada (precio según el largo, con colocación y sellado profesional)
- Económica y Estándar: ${tabla('estandar', 'mesada')}
- Premium: ${tabla('premium', 'mesada')}
El material (granito natural o sintético premium) se define con Marcelo. Las mesadas en L y las medidas especiales las cotiza Marcelo.

## Condiciones
- Siempre incluye: fabricación a medida, cantos termofusionados, ajuste final de puertas y cajones, limpieza final.
- No incluye: bacha, grifería, electrodomésticos, electricidad, plomería, pintura o revestimientos, retiro de los muebles viejos.
- Plazo: 15 a 20 días hábiles de fabricación desde que se confirma el presupuesto; la colocación se hace en un día.
- Garantía escrita: 12 meses sobre herrajes y estructura.
- Pago: por etapas; se abonan los materiales para arrancar y el resto en cuotas acordadas con Marcelo. Sin financiación bancaria.
- Zona: Santa Fe Capital y alrededores (Santo Tomé, Recreo, Rincón). Más lejos depende del proyecto: lo ve Marcelo.`

// Los pasos de cotización que comparten los dos bots.
export const PASOS_COTIZAR = `1. Si no lo dijo, preguntá qué necesita: bajo mesada, alacena, mesada o la cocina completa.
2. Pedí el largo de cada módulo en metros (si da las medidas de las paredes, sumalas). Preguntá qué línea le interesa; si no sabe, sugerí Estándar.
3. Calculá cada módulo por separado con los datos de arriba y sumalos: el bajo mesada es metros × precio por ml; la alacena y la mesada salen de su tabla, con la medida más cercana. Nunca cobres la alacena ni la mesada al precio del bajo mesada.
4. Presentá el total redondeado como orientativo, con el detalle por módulo en una línea (por ejemplo: "bajo mesada 2 m $720.000 + alacena 1,60 m $354.779, unos $1.075.000 en línea Estándar"). Decí qué pasa con la colocación en esa línea, y aclará SIEMPRE que el precio exacto sale del relevamiento del espacio.
5. Para placards, vestidores, muebles de baño u otros muebles no hay lista: tomá los datos y decí que los cotiza Marcelo.`
