// Lista de precios de MCP: la única. La usan la calculadora de /cocinas, el PDF,
// /proyecto-cocina, el chat de la web y el bot de WhatsApp, para que todos den el
// mismo número. Es .mjs para que también la lea db/kapso-setup.mjs, que corre sin
// compilar. Si cambia un precio, hay que deployar y correr `npm run whatsapp:setup`.
//
// Fuente: lista oficial de MCP (lista-de-precios-mcpmuebles).

export const PRECIOS_ACTUALIZADOS = 'agosto 2026'

/** Medidas de la lista oficial, en cm. */
export const LARGOS_LISTA = [120, 140, 160, 180, 200]

/** @typedef {'economica' | 'estandar' | 'premium' | 'topeDeGama'} LineaId */
/** @typedef {'bajoMesada' | 'alacena' | 'mesada'} ModuloId */

/** Bajo mesada: precio por metro lineal. */
export const PRECIO_ML_BAJO_MESADA = {
  economica: 310000,
  estandar: 360000,
  premium: 440000,
  // Tope de Gama usa el mismo mueble que la Premium (MDF Egger) y le suma el
  // equipamiento de TOPE_DE_GAMA. REVISAR con Marcelo si el mueble base cambia.
  topeDeGama: 440000,
}

// Alacena y mesada salen de la lista oficial. Económica y Estándar comparten
// tabla: la Económica solo se diferencia en el bajo mesada.
export const TABLA_BASE = {
  alacena: [272479, 313629, 354779, 395929, 435966],
  mesada: [344769, 391480, 434854, 479341, 523827],
}

export const TABLA_PREMIUM = {
  alacena: [405938, 453761, 500472, 548294, 595005],
  mesada: [489350, 543846, 593893, 646164, 697324],
}

/**
 * Precio de un módulo de `largo` cm. El bajo mesada va por metro lineal. Para
 * el resto, entre dos medidas de lista interpola en línea recta; fuera de la
 * lista escala con el precio por metro del extremo más cercano (REVISAR con
 * Marcelo: debajo de 1.20 m y arriba de 2.00 m).
 * @param {LineaId} linea
 * @param {ModuloId} modulo
 * @param {number} largo
 * @returns {number}
 */
export function precioModulo(linea, modulo, largo) {
  if (modulo === 'bajoMesada') return Math.round((PRECIO_ML_BAJO_MESADA[linea] * largo) / 100)

  const premium = linea === 'premium' || linea === 'topeDeGama'
  const precios = (premium ? TABLA_PREMIUM : TABLA_BASE)[modulo]
  const ultimo = LARGOS_LISTA.length - 1

  if (largo <= LARGOS_LISTA[0]) return Math.round((precios[0] * largo) / LARGOS_LISTA[0])
  if (largo >= LARGOS_LISTA[ultimo]) {
    return Math.round((precios[ultimo] * largo) / LARGOS_LISTA[ultimo])
  }

  const i = LARGOS_LISTA.findIndex((l) => l >= largo)
  const [desde, hasta] = [LARGOS_LISTA[i - 1], LARGOS_LISTA[i]]
  const avance = (largo - desde) / (hasta - desde)
  return Math.round(precios[i - 1] + (precios[i] - precios[i - 1]) * avance)
}

// ── Lista de Marcelo del 2026-11-24: Tope de Gama, mesadas, piletas y adicionales ──

/** Equipamiento que la línea Tope de Gama suma sobre el mueble. */
export const TOPE_DE_GAMA = {
  colores: ['Arcilla', 'Gris Perla', 'Macadan', 'Cubanita', 'Gris Sombra'],
  /** Perfil Gola en el bajo mesada: se vende en tiras de 3 m. */
  gola: { metrosTira: 3, precioTira: 90000 },
  /** Luces LED en la alacena: tiras de 3 m lineales. */
  led: { metrosTira: 3, precioTira: 100000 },
  /** Correderas con cierre suave, por cajón. */
  precioCajon: 45000,
  cajonesDefault: 3,
  cajonesMax: 12,
}

/** @typedef {'grisPerla' | 'negroBoreal' | 'negroBrasil' | 'sinteticoEstandar' | 'sinteticoMedida'} MesadaId */

/**
 * Mesadas. `porMetro`: precio por metro lineal. `medidas`: solo esas medidas, en cm,
 * con su precio (el sintético estándar ya trae la bacha simple). Sin precio = a consultar.
 * @type {{ id: MesadaId, nombre: string, detalle: string, porMetro?: number, medidas?: Record<number, number> }[]}
 */
export const MESADAS = [
  { id: 'grisPerla', nombre: 'Granito Gris Perla', detalle: 'Granito natural', porMetro: 287308 },
  { id: 'negroBoreal', nombre: 'Granito Negro Boreal', detalle: 'Granito natural · precio a consultar' },
  { id: 'negroBrasil', nombre: 'Granito Negro Brasil', detalle: 'Importado · precio a consultar' },
  {
    id: 'sinteticoEstandar',
    nombre: 'Granito sintético estándar',
    detalle: 'Con bacha simple, en medidas fijas de 60 cm de fondo',
    medidas: { 120: 155571, 140: 174810, 160: 189476, 180: 214891, 200: 234366 },
  },
  { id: 'sinteticoMedida', nombre: 'Granito sintético a medida', detalle: 'Cortado a tu medida', porMetro: 170000 },
]

/** @typedef {'z52' | 'cc28' | 'luxor71'} PiletaId */

/** Piletas de acero inoxidable: se suman aparte de la mesada, por unidad. */
export const PILETAS = /** @type {{ id: PiletaId, nombre: string, precio: number }[]} */ ([
  { id: 'z52', nombre: 'Pileta Z52', precio: 85000 },
  { id: 'cc28', nombre: 'Pileta CC28', precio: 145000 },
  { id: 'luxor71', nombre: 'Pileta Luxor 71 (SI71)', precio: 250000 },
])

/** @typedef {'cubertero' | 'portaResiduos'} AdicionalId */

/** Opcionales para Económica, Estándar y Premium. En Tope de Gama vienen incluidos. */
export const ADICIONALES = /** @type {{ id: AdicionalId, nombre: string, precio: number }[]} */ ([
  { id: 'cubertero', nombre: 'Cubertero a medida', precio: 35000 },
  { id: 'portaResiduos', nombre: 'Porta residuos extraíble con apertura de puerta', precio: 150000 },
])

/**
 * Opcionales con cantidad, para Económica, Estándar y Premium (Tope de Gama ya
 * trae los suyos en TOPE_DE_GAMA). Lista de Marcelo del 2026-11-24, 15:27.
 */
export const EXTRAS = {
  /** Luces LED en la alacena: tiras de 3 m sobre los metros de alacena. */
  led: { nombre: 'Luces LED en alacena', metrosTira: 3, precioTira: 100000 },
  /** Puerta con vidrio y perfil de aluminio GrupoEuro, por puerta. */
  puertaVidrio: { nombre: 'Puerta con vidrio perfil GrupoEuro', precio: 100000, max: 6 },
}

/**
 * Precio de un tramo de mesada, o null si es a consultar o la medida no existe
 * para ese material.
 * @param {MesadaId} id
 * @param {number} largo en cm
 * @returns {number | null}
 */
export function precioMesada(id, largo) {
  const mesada = MESADAS.find((m) => m.id === id)
  if (!mesada) return null
  if (mesada.porMetro) return Math.round((mesada.porMetro * largo) / 100)
  return mesada.medidas?.[largo] ?? null
}

/** Tiras de `metrosTira` que hacen falta para cubrir `largo` cm. */
export const tiras = (/** @type {number} */ largo, /** @type {number} */ metrosTira) =>
  Math.ceil(largo / (metrosTira * 100))

/** @param {number} monto */
export const pesos = (monto) => `$${monto.toLocaleString('es-AR')}`

// ── Placares (/placares) ──
// Lista de Marcelo del 2026-11-27 (18:59): $800.000 por metro cúbico
// (ancho × alto × profundidad, en metros). Ej.: 2,00 × 2,40 × 0,60 = 2,88 m³ = $2.304.000.
// Es de referencia: el tipo de puerta, la distribución interior y las terminaciones
// se afinan al cotizar formalmente.

/** Medidas en cm: [mínimo, máximo, paso, inicial]. */
export const PLACARES = {
  precioM3: 800000,
  ancho: { min: 60, max: 400, paso: 10, inicial: 200 },
  alto: { min: 180, max: 280, paso: 5, inicial: 240 },
  profundidad: { min: 40, max: 70, paso: 5, inicial: 60 },
}

/** Volumen en m³ y precio de un placard; medidas en cm. */
export function precioPlacard(/** @type {number} */ ancho, /** @type {number} */ alto, /** @type {number} */ profundidad) {
  const m3 = (ancho * alto * profundidad) / 1e6
  return { m3, precio: Math.round(m3 * PLACARES.precioM3) }
}
