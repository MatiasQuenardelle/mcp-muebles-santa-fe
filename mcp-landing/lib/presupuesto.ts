// Modelo y cálculo de los presupuestos. Lo usan el editor del panel (cliente),
// el PDF y las rutas de la API, así que NO puede importar lib/db.
//
// Es el mismo esquema de la planilla de Marcelo (presupuestos/generador/build.py):
// cuatro fases, y la forma de pago en cuatro etapas donde la etapa N es el total
// de la fase N. La última se cobra como saldo.

export type SeccionId = 'materiales' | 'produccion' | 'mano_obra' | 'mesada'

export interface Item {
  concepto: string
  cantidad: number
  precio: number
}

export interface Seccion {
  id: SeccionId
  items: Item[]
}

/** Presupuesto formal: lo arma Marcelo desde el panel. */
export interface PresupuestoData {
  cliente: string
  localidad: string
  proyecto: string
  /** 'YYYY-MM-DD' */
  fecha: string
  validezDias: number
  entrega: string
  garantia: string
  secciones: Seccion[]
}

/** Presupuesto preliminar: lo genera un visitante desde la calculadora de /cocinas. */
export interface PreliminarData {
  cliente: string
  fecha: string
  validezDias: number
  linea: string
  /** Lo que incluye la línea elegida (LINEAS[].incluye en components/cocinas/data.ts). */
  incluye: string[]
  /** La línea Económica se entrega sin colocar: cambia el texto de la etapa 3. */
  conColocacion: boolean
  notaColocacion: string
  preciosActualizados: string
  modulos: { nombre: string; medida: string; precio: number }[]
  total: number
}

export const SECCIONES: { id: SeccionId; titulo: string }[] = [
  { id: 'materiales', titulo: 'Materiales e insumos' },
  { id: 'produccion', titulo: 'Producción' },
  { id: 'mano_obra', titulo: 'Mano de obra' },
  { id: 'mesada', titulo: 'Mesada y extras' },
]

// Los renglones de la planilla de Marcelo, con los precios del presupuesto de
// Natalia (octubre 2026). Solo se usan en el primer presupuesto: después cada
// uno nuevo copia los precios del último (ver lastFormalItems en lib/db.ts).
export const ITEMS_DEFAULT: Record<SeccionId, Item[]> = {
  materiales: [
    { concepto: 'Melamina color blanco', cantidad: 0, precio: 95000 },
    { concepto: 'Melamina de color', cantidad: 0, precio: 150000 },
    { concepto: 'Tapacantos blanco PVC (metros)', cantidad: 0, precio: 300 },
    { concepto: 'Tapacantos color PVC (metros)', cantidad: 0, precio: 1000 },
    { concepto: 'Fibroplus', cantidad: 0, precio: 40000 },
    { concepto: 'Tornillos, tarugos Fisher e insumos', cantidad: 0, precio: 1000 },
    { concepto: 'Correderas telescópicas (juegos)', cantidad: 0, precio: 7500 },
    { concepto: 'Bisagras', cantidad: 0, precio: 1000 },
    { concepto: 'Colgadores (alacenas)', cantidad: 0, precio: 1000 },
    { concepto: 'Luces LED para alacenas', cantidad: 0, precio: 87000 },
    { concepto: 'Porta residuos - cubertero - extraíbles', cantidad: 0, precio: 140000 },
    { concepto: 'Manijas / tiradores', cantidad: 0, precio: 2600 },
    { concepto: 'Pistones a gas para puertas elevadizas', cantidad: 0, precio: 5000 },
    { concepto: 'Tapones de silicona tapatornillos blancos', cantidad: 0, precio: 3000 },
    { concepto: 'Traslado logística (flete materiales)', cantidad: 0, precio: 10000 },
  ],
  produccion: [
    { concepto: 'Cortes placas fibrofácil 18 mm', cantidad: 0, precio: 30000 },
    { concepto: 'Cortes de fibroplus 3 mm (fondos de los módulos)', cantidad: 0, precio: 18000 },
    { concepto: 'Pegado de cantos PVC 0.5', cantidad: 0, precio: 1100 },
    { concepto: 'Traslado (logística interna)', cantidad: 0, precio: 10000 },
  ],
  mano_obra: [{ concepto: 'Mano de obra (armado e instalación MCP)', cantidad: 0, precio: 0 }],
  mesada: [
    { concepto: 'Granito Gris Perla + Pileta Johnson Z52 (8 m²)', cantidad: 0, precio: 0 },
    { concepto: 'Traslado (de mesada a obra)', cantidad: 0, precio: 45000 },
    { concepto: 'Traslado de los módulos (entrega en obra)', cantidad: 0, precio: 50000 },
  ],
}

export const ETAPAS: { titulo: string; explicacion: string }[] = [
  {
    titulo: 'Inicio del proyecto',
    explicacion: 'Para comenzar la labor, compramos todos los materiales, herrajes e insumos de tu cocina.',
  },
  {
    titulo: 'Producción',
    explicacion: 'Cortamos las placas a medida y canteamos todos los bordes con PVC.',
  },
  {
    titulo: 'Armado e instalación',
    explicacion: 'Mano de obra especializada MCP: armado de los módulos y colocación en obra.',
  },
  {
    titulo: 'Entrega final',
    explicacion: 'Completamos el saldo: mesada, traslados y entrega de tu cocina terminada.',
  },
]

export const CARACTERISTICAS = [
  'Muebles fabricados a medida, adaptados al espacio, las necesidades y la distribución del ambiente.',
  'Estructuras y frentes en MDF revestido en melamina de primera calidad, según colores y diseños seleccionados.',
  'Cantos con terminación en PVC para mayor protección, resistencia y durabilidad.',
  'Cajones equipados con correderas telescópicas Grupo Euro.',
  'Puertas con bisagras reforzadas Grupo Euro.',
  'Estantes interiores, módulos y espacios de guardado según el diseño proyectado.',
  'Patas plásticas regulables y zócalos inferiores de terminación en los muebles correspondientes.',
  'Mano de obra especializada, fabricación a medida y control de calidad de las terminaciones.',
  'Colocación e instalación del mobiliario en obra incluidas.',
]

export const CALIDAD = [
  'En MCP Muebles diseñamos espacios pensados para la vida de las personas, combinando funcionalidad, estética y calidad constructiva.',
  'Contamos con más de 20 años de experiencia en el sector, brindando atención directa, asesoramiento personalizado y soluciones a medida, con especial cuidado en cada etapa del proyecto.',
]

export const ALCANCE = [
  'Esta propuesta contempla el mobiliario de cocina detallado en el diseño y la distribución acordados, con fabricación a medida y colocación incluida.',
  'No incluye mesada, pileta, grifería, electrodomésticos, instalaciones de agua, gas o electricidad, ni trabajos de albañilería, salvo que se indiquen expresamente en el presupuesto.',
]

export const WHATSAPP_VISIBLE = '342 408-1534'

export const PASOS = [
  `Confirmás la propuesta por WhatsApp al ${WHATSAPP_VISIBLE} y coordinamos los últimos detalles del diseño.`,
  'Abonás la Etapa 1 y comenzamos con la compra de materiales para tu cocina.',
  'Te vamos informando el avance en cada etapa, hasta la instalación final en tu casa.',
]

export function subtotalItem(item: Item): number {
  return Math.round(item.cantidad * item.precio * 100) / 100
}

export interface Calculo {
  secciones: { id: SeccionId; titulo: string; items: Item[]; subtotal: number }[]
  total: number
  etapas: { titulo: string; explicacion: string; monto: number; pct: number }[]
}

/** Subtotales, total y etapas. Los renglones en cero no entran: el cliente no los ve. */
export function calcular(data: Pick<PresupuestoData, 'secciones'>): Calculo {
  const secciones = SECCIONES.map(({ id, titulo }) => {
    const items = (data.secciones.find((s) => s.id === id)?.items ?? []).filter(
      (item) => subtotalItem(item) !== 0
    )
    const subtotal = items.reduce((acc, item) => acc + subtotalItem(item), 0)
    return { id, titulo, items, subtotal }
  })
  const total = secciones.reduce((acc, s) => acc + s.subtotal, 0)
  const etapas = ETAPAS.map((etapa, i) => {
    // Las tres primeras cubren su fase; la última es el saldo, así las etapas
    // siempre suman el total aunque haya redondeos.
    const monto =
      i < ETAPAS.length - 1
        ? secciones[i].subtotal
        : total - secciones.slice(0, i).reduce((acc, s) => acc + s.subtotal, 0)
    return { ...etapa, monto, pct: total === 0 ? 0 : monto / total }
  })
  return { secciones, total, etapas }
}

/** Presupuesto en blanco para un contacto, con los renglones (y precios) de `items`. */
export function presupuestoNuevo(
  contacto: { cliente: string; localidad: string; proyecto: string },
  items: Record<SeccionId, Item[]>,
  fecha: string
): PresupuestoData {
  return {
    ...contacto,
    fecha,
    validezDias: 10,
    entrega: 'A acordar con el cliente',
    garantia: 'Sí',
    secciones: SECCIONES.map(({ id }) => ({
      id,
      items: items[id].map((item) => ({ ...item, cantidad: 0 })),
    })),
  }
}

/** 'YYYY-MM-DD' + días → 'DD/MM/YYYY'. */
export function venceEl(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return formatearFecha(d.toISOString().slice(0, 10))
}

export function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export function pesos(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-AR')}`
}

export function cantidadTexto(n: number): string {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}
