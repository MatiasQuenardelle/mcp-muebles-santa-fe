// Todas las reglas de plata del panel, una sola vez. Cuánto debe un cliente, cuánto
// se le debe a un proveedor, qué costó una obra, cuánto se ganó.
//
// Sin imports que existan en runtime: lo corren los tests con `node --test` tal
// cual, y lo pueden usar tanto el servidor como los componentes cliente.

export const ETAPAS_OBRA = ['medicion', 'diseno', 'materiales', 'corte', 'armado', 'colocacion'] as const
export type EtapaObra = (typeof ETAPAS_OBRA)[number]

export type GrupoCategoria = 'ingreso' | 'negocio' | 'familia'
export type ClaveCategoria =
  | 'cobro_obra'
  | 'devolucion_cliente'
  | 'pago_proveedor'
  | 'devolucion_proveedor'
  | 'comision'
export type TipoMovimiento = 'ingreso' | 'egreso' | 'transferencia'
export type FrecuenciaGasto = 'semanal' | 'mensual'

export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}

// ---------------------------------------------------------------- Obras

export interface ObraBase {
  total: number
  ajustes: number
  cobrado_inicial: number
  cobros: number
  devoluciones: number
  // Renglones de compras recibidas imputados a esta obra.
  materiales: number
  // Egresos con obra_id: flete, colocador tercerizado. Nunca pagos a proveedor.
  gastos_directos: number
  comision_pct: number
  entregada_en: string | null
  cancelada_en: string | null
}

export interface ResumenObra {
  totalVigente: number
  cobradoNeto: number
  pendiente: number
  saldoAFavor: number
  anticipo: number
  comision: number
  costo: number
  margen: number
  entregada: boolean
  cancelada: boolean
}

export function resumirObra(obra: ObraBase): ResumenObra {
  const cancelada = obra.cancelada_en !== null
  const entregada = obra.entregada_en !== null
  const totalVigente = redondear(obra.total + obra.ajustes)
  const cobradoNeto = redondear(obra.cobrado_inicial + obra.cobros - obra.devoluciones)
  const comision = cancelada ? 0 : redondear((totalVigente * obra.comision_pct) / 100)
  const costo = redondear(obra.materiales + obra.gastos_directos + comision)
  return {
    totalVigente,
    cobradoNeto,
    pendiente: cancelada ? 0 : Math.max(redondear(totalVigente - cobradoNeto), 0),
    saldoAFavor: Math.max(redondear(cobradoNeto - totalVigente), 0),
    anticipo: cancelada || entregada ? 0 : Math.max(Math.min(cobradoNeto, totalVigente), 0),
    comision,
    costo,
    // Cancelada: el contrato ya no existe, lo que quedó es lo cobrado menos lo gastado.
    margen: redondear((cancelada ? cobradoNeto : totalVigente) - costo),
    entregada,
    cancelada,
  }
}

export function etapaAlcanzada(actual: EtapaObra, requerida: EtapaObra | null): boolean {
  return requerida === null || ETAPAS_OBRA.indexOf(actual) >= ETAPAS_OBRA.indexOf(requerida)
}

export interface Cuota {
  orden: number
  concepto: string
  monto: number
  etapa_exigible: EtapaObra | null
}

export type EstadoCuota = 'pagada' | 'parcial' | 'exigible' | 'futura'

export interface CuotaVigente extends Cuota {
  // El monto ya ajustado al contrato vigente.
  vigente: number
  pagado: number
  saldo: number
  exigible: boolean
  estado: EstadoCuota
}

export interface AvanceObra {
  etapa: EtapaObra
  entregada: boolean
  cancelada: boolean
}

// Las cuotas originales no se tocan: si el contrato sube o baja, la última absorbe
// la diferencia (misma regla que `calcular` de lib/presupuesto) y lo cobrado se
// aplica en orden. Así no hace falta imputar cada pago a una cuota.
export function cuotasVigentes(
  totalVigente: number,
  cobradoNeto: number,
  cuotas: Cuota[],
  avance: AvanceObra
): CuotaVigente[] {
  const ordenadas = [...cuotas].sort((a, b) => a.orden - b.orden)
  let restante = totalVigente
  let porAplicar = Math.max(Math.min(cobradoNeto, totalVigente), 0)
  return ordenadas.map((cuota, indice) => {
    const esUltima = indice === ordenadas.length - 1
    const vigente = redondear(esUltima ? restante : Math.min(cuota.monto, restante))
    restante = redondear(restante - vigente)
    const pagado = redondear(Math.min(vigente, porAplicar))
    porAplicar = redondear(porAplicar - pagado)
    const saldo = redondear(vigente - pagado)
    const exigible =
      !avance.cancelada && (avance.entregada || etapaAlcanzada(avance.etapa, cuota.etapa_exigible))
    const estado: EstadoCuota =
      saldo === 0 ? 'pagada' : pagado > 0 ? 'parcial' : exigible ? 'exigible' : 'futura'
    return { ...cuota, vigente, pagado, saldo, exigible, estado }
  })
}

// Lo que ya se le puede reclamar al cliente, no todo lo que falta cobrar.
export function exigibleObra(resumen: ResumenObra, cuotas: CuotaVigente[]): number {
  if (resumen.cancelada) {
    return 0
  }
  if (cuotas.length === 0) {
    return resumen.entregada ? resumen.pendiente : 0
  }
  return redondear(cuotas.reduce((suma, cuota) => suma + (cuota.exigible ? cuota.saldo : 0), 0))
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000)
}

// ---------------------------------------------------------------- Proveedores

export interface CompraBase {
  id: string
  fecha: string
  vence_el: string | null
  total: number
}

export interface CompraSaldo extends CompraBase {
  pagado: number
  saldo: number
  estado: 'pagada' | 'parcial' | 'impaga'
  vencida: boolean
}

export interface CuentaProveedor {
  compras: CompraSaldo[]
  saldo: number
  deuda: number
  aFavor: number
  vencido: number
}

// El saldo es por proveedor: una transferencia suele pagar varias facturas, o
// llegar antes que la mercadería. Cada compra se marca aplicando lo pagado de la
// más vieja a la más nueva. `pagosNetos` = pagos - devoluciones del proveedor.
export function cuentaProveedor(
  saldoInicial: number,
  pagosNetos: number,
  comprasRecibidas: CompraBase[],
  hoy: string
): CuentaProveedor {
  const ordenadas = [...comprasRecibidas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id)
  )
  const totalCompras = ordenadas.reduce((suma, compra) => suma + compra.total, 0)
  const saldo = redondear(saldoInicial + totalCompras - pagosNetos)

  // Lo pagado cubre primero lo que ya se debía antes de usar el panel.
  let disponible = redondear(Math.max(pagosNetos, 0) - saldoInicial)
  disponible = Math.max(disponible, 0)

  const compras = ordenadas.map((compra): CompraSaldo => {
    const pagado = redondear(Math.min(compra.total, disponible))
    disponible = redondear(disponible - pagado)
    const resto = redondear(compra.total - pagado)
    return {
      ...compra,
      pagado,
      saldo: resto,
      estado: resto === 0 ? 'pagada' : pagado > 0 ? 'parcial' : 'impaga',
      vencida: resto > 0 && compra.vence_el !== null && compra.vence_el < hoy,
    }
  })

  return {
    compras,
    saldo,
    deuda: Math.max(saldo, 0),
    aFavor: Math.max(-saldo, 0),
    vencido: redondear(compras.reduce((suma, compra) => suma + (compra.vencida ? compra.saldo : 0), 0)),
  }
}

// ---------------------------------------------------------------- Ganancia

export interface SumaMovimientos {
  grupo: GrupoCategoria
  tipo: 'ingreso' | 'egreso'
  total: number
}

export interface GananciaCaja {
  ingresos: number
  gastosNegocio: number
  gananciaNegocio: number
  gastosFamilia: number
  netaLibre: number
}

// Base caja, igual que la planilla: lo que entró menos lo que salió en el período.
// No es el margen de las obras y no se suma con él: una compra a crédito baja el
// margen hoy y la caja recién cuando se paga. Las transferencias no llegan acá.
export function gananciaDeCaja(sumas: SumaMovimientos[]): GananciaCaja {
  const neto = (grupo: GrupoCategoria, positivo: 'ingreso' | 'egreso') =>
    sumas
      .filter((suma) => suma.grupo === grupo)
      .reduce((acumulado, suma) => acumulado + (suma.tipo === positivo ? suma.total : -suma.total), 0)

  const ingresos = redondear(neto('ingreso', 'ingreso'))
  const gastosNegocio = redondear(neto('negocio', 'egreso'))
  const gastosFamilia = redondear(neto('familia', 'egreso'))
  const gananciaNegocio = redondear(ingresos - gastosNegocio)
  return {
    ingresos,
    gastosNegocio,
    gananciaNegocio,
    gastosFamilia,
    netaLibre: redondear(gananciaNegocio - gastosFamilia),
  }
}

// ---------------------------------------------------------------- Movimientos

export interface CategoriaRegla {
  grupo: GrupoCategoria
  clave: ClaveCategoria | null
}

// Si la categoría suma o resta caja. Las dos devoluciones son las únicas que van
// al revés de su grupo.
export function tipoDeCategoria(categoria: CategoriaRegla): 'ingreso' | 'egreso' {
  if (categoria.clave === 'devolucion_cliente') {
    return 'egreso'
  }
  if (categoria.clave === 'devolucion_proveedor') {
    return 'ingreso'
  }
  return categoria.grupo === 'ingreso' ? 'ingreso' : 'egreso'
}

export interface MovimientoRegla {
  tipo: TipoMovimiento
  cuentaId: string
  cuentaDestinoId: string | null
  categoria: CategoriaRegla | null
  obraId: string | null
  proveedorId: string | null
  personalId: string | null
}

// Devuelve el mensaje de error, o null si el movimiento es válido. Qué datos
// lleva cada movimiento define a qué reporte suma: sin esto un pago mal cargado
// infla el costo de una obra sin que nadie lo note.
export function errorDeMovimiento(movimiento: MovimientoRegla): string | null {
  const { tipo, cuentaId, cuentaDestinoId, categoria, obraId, proveedorId, personalId } = movimiento

  if (tipo === 'transferencia') {
    if (!cuentaDestinoId) {
      return 'Elegí la cuenta de destino.'
    }
    if (cuentaDestinoId === cuentaId) {
      return 'La cuenta de origen y la de destino son la misma.'
    }
    if (categoria || obraId || proveedorId || personalId) {
      return 'Una transferencia entre cuentas no lleva categoría, obra, proveedor ni persona.'
    }
    return null
  }

  if (cuentaDestinoId) {
    return 'Solo una transferencia lleva cuenta de destino.'
  }
  if (!categoria) {
    return 'Elegí una categoría.'
  }
  if (tipoDeCategoria(categoria) !== tipo) {
    return 'Esa categoría no corresponde a este tipo de movimiento.'
  }

  switch (categoria.clave) {
    case 'cobro_obra':
    case 'devolucion_cliente':
      if (!obraId) {
        return 'Elegí a qué obra corresponde.'
      }
      return proveedorId || personalId ? 'Este movimiento solo lleva obra.' : null
    case 'pago_proveedor':
    case 'devolucion_proveedor':
      if (!proveedorId) {
        return 'Elegí el proveedor.'
      }
      return obraId || personalId ? 'Este movimiento solo lleva proveedor.' : null
    case 'comision':
      if (!personalId) {
        return 'Elegí a quién se le paga la comisión.'
      }
      return obraId || proveedorId ? 'Este movimiento solo lleva persona.' : null
    default:
      break
  }

  if (categoria.grupo === 'familia' && (obraId || proveedorId || personalId)) {
    return 'Un gasto de la familia no se vincula a obras, proveedores ni personal.'
  }
  if (categoria.grupo === 'ingreso' && (obraId || proveedorId || personalId)) {
    return 'Para cobrar una obra usá la categoría "Cobro de obra".'
  }
  if (proveedorId) {
    return 'Para pagarle a un proveedor usá la categoría "Pago a proveedor".'
  }
  return null
}

// ---------------------------------------------------------------- Períodos

export type PeriodoClave = 'semana_actual' | 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'todo'

export interface Periodo {
  clave: PeriodoClave | 'mes'
  desde: string
  // Exclusivo: `fecha >= desde and fecha < hastaExcl`.
  hastaExcl: string
  etiqueta: string
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function clave(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

function lunesDe(hoy: string): Date {
  const fecha = new Date(`${hoy}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() - ((fecha.getUTCDay() + 6) % 7))
  return fecha
}

export function rangoPeriodo(periodo: PeriodoClave, hoy: string): Periodo {
  const anio = Number(hoy.slice(0, 4))
  const mes = Number(hoy.slice(5, 7)) - 1
  const inicioMes = (a: number, m: number) => clave(new Date(Date.UTC(a, m, 1)))

  switch (periodo) {
    case 'semana_actual': {
      const lunes = lunesDe(hoy)
      const siguiente = new Date(lunes)
      siguiente.setUTCDate(lunes.getUTCDate() + 7)
      return { clave: periodo, desde: clave(lunes), hastaExcl: clave(siguiente), etiqueta: 'esta semana' }
    }
    case 'mes_actual':
      return { clave: periodo, desde: inicioMes(anio, mes), hastaExcl: inicioMes(anio, mes + 1), etiqueta: 'este mes' }
    case 'mes_anterior':
      return { clave: periodo, desde: inicioMes(anio, mes - 1), hastaExcl: inicioMes(anio, mes), etiqueta: 'el mes pasado' }
    case 'anio_actual':
      return { clave: periodo, desde: inicioMes(anio, 0), hastaExcl: inicioMes(anio + 1, 0), etiqueta: 'este año' }
    default:
      return { clave: 'todo', desde: '2000-01-01', hastaExcl: '2100-01-01', etiqueta: 'desde el inicio' }
  }
}

/** Un mes puntual, `YYYY-MM`. Null si el texto no es un mes válido. */
export function rangoMes(mesClave: string): Periodo | null {
  const coincide = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mesClave)
  if (!coincide) {
    return null
  }
  const anio = Number(coincide[1])
  const mes = Number(coincide[2]) - 1
  return {
    clave: 'mes',
    desde: clave(new Date(Date.UTC(anio, mes, 1))),
    hastaExcl: clave(new Date(Date.UTC(anio, mes + 1, 1))),
    etiqueta: `${MESES[mes]} ${anio}`,
  }
}

// ---------------------------------------------------------------- Asistente

function cifrasDe(texto: string): string[] {
  const normal = texto.replace(/ /g, ' ')
  const conSigno = Array.from(normal.matchAll(/\$\s*(\d[\d.]*(?:,\d+)?)/g), (m) => m[1])
  const conMiles = normal.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?/g) ?? []
  return Array.from(new Set([...conSigno, ...conMiles].map((cifra) => cifra.replace(/\.$/, ''))))
}

/** Los montos de `texto` que no aparecen en los reportes. "Millones" no se puede cotejar. */
export function cifrasSinRespaldo(texto: string, reportes: string[]): string[] {
  const respaldadas = new Set(reportes.flatMap(cifrasDe))
  const sueltas = cifrasDe(texto).filter((cifra) => !respaldadas.has(cifra))
  return /\bmill[oó]n(es)?\b/i.test(texto) ? [...sueltas, 'millones'] : sueltas
}

// Una generación de gasto fijo por período: `2026-11` o la semana ISO `2026-W45`.
export function periodoDeGastoFijo(frecuencia: FrecuenciaGasto, fecha: string): string {
  if (frecuencia === 'mensual') {
    return fecha.slice(0, 7)
  }
  const jueves = lunesDe(fecha)
  jueves.setUTCDate(jueves.getUTCDate() + 3)
  const anio = jueves.getUTCFullYear()
  const primero = Date.UTC(anio, 0, 1)
  const semana = Math.ceil(((jueves.getTime() - primero) / 86_400_000 + 1) / 7)
  return `${anio}-W${String(semana).padStart(2, '0')}`
}
