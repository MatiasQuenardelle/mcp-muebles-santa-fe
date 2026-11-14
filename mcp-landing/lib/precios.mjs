// Lista de precios de MCP: la única. La usan la calculadora de /cocinas, el PDF,
// /proyecto-cocina, el chat de la web y el bot de WhatsApp, para que todos den el
// mismo número. Es .mjs para que también la lea db/kapso-setup.mjs, que corre sin
// compilar. Si cambia un precio, hay que deployar y correr `npm run whatsapp:setup`.
//
// Fuente: lista oficial de MCP (lista-de-precios-mcpmuebles).

export const PRECIOS_ACTUALIZADOS = 'agosto 2026'

/** Medidas de la lista oficial, en cm. */
export const LARGOS_LISTA = [120, 140, 160, 180, 200]

/** @typedef {'economica' | 'estandar' | 'premium'} LineaId */
/** @typedef {'bajoMesada' | 'alacena' | 'mesada'} ModuloId */

/** Bajo mesada: precio por metro lineal. */
export const PRECIO_ML_BAJO_MESADA = {
  economica: 310000,
  estandar: 360000,
  premium: 440000,
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

  const precios = (linea === 'premium' ? TABLA_PREMIUM : TABLA_BASE)[modulo]
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

/** @param {number} monto */
export const pesos = (monto) => `$${monto.toLocaleString('es-AR')}`
