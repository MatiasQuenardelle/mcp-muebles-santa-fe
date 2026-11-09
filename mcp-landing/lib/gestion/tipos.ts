// Contratos compartidos de la gestión. Se puede importar desde componentes cliente:
// no toca lib/db ni nada del servidor.

import type { EtapaObra, TipoMovimiento } from './calculos'

export { ETAPAS_OBRA } from './calculos'
export type {
  AvanceObra,
  ClaveCategoria,
  CompraSaldo,
  Cuota,
  CuotaVigente,
  EstadoCuota,
  EtapaObra,
  FrecuenciaGasto,
  GananciaCaja,
  GrupoCategoria,
  Periodo,
  PeriodoClave,
  ResumenObra,
  TipoMovimiento,
} from './calculos'

export const ETAPA_LABELS: Record<EtapaObra, string> = {
  medicion: 'Medición',
  diseno: 'Diseño',
  materiales: 'Materiales',
  corte: 'Corte',
  armado: 'Armado',
  colocacion: 'Colocación',
}

export type EstadoCompra = 'pedido' | 'recibido' | 'cancelado'
export type TipoCuenta = 'efectivo' | 'banco' | 'billetera'

export const ESTADO_COMPRA_LABELS: Record<EstadoCompra, string> = {
  pedido: 'Pedido',
  recibido: 'Recibido',
  cancelado: 'Cancelado',
}

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  ingreso: 'Ingreso',
  egreso: 'Gasto',
  transferencia: 'Transferencia',
}

export const TIPO_CUENTA_LABELS: Record<TipoCuenta, string> = {
  efectivo: 'Efectivo',
  banco: 'Banco',
  billetera: 'Billetera',
}

// Lo que recibe registrarMovimiento. `id` lo genera el navegador: reenviar el
// mismo formulario no carga dos veces.
export interface MovimientoNuevo {
  id: string
  fecha: string
  tipo: TipoMovimiento
  monto: number
  cuentaId: string
  cuentaDestinoId: string | null
  categoriaId: string | null
  obraId: string | null
  proveedorId: string | null
  personalId: string | null
  nota: string | null
}

export interface MovimientoFila {
  id: string
  fecha: string
  tipo: TipoMovimiento
  monto: number
  cuenta_id: string
  cuenta_nombre: string
  cuenta_destino_nombre: string | null
  categoria_nombre: string | null
  categoria_clave: string | null
  grupo: 'ingreso' | 'negocio' | 'familia' | null
  obra_id: string | null
  obra_numero: string | null
  obra_titulo: string | null
  proveedor_id: string | null
  proveedor_nombre: string | null
  personal_id: string | null
  personal_nombre: string | null
  nota: string | null
  creado_por_nombre: string | null
  created_at: string
  anulado_en: string | null
  anulado_motivo: string | null
}

export interface OpcionesMovimiento {
  cuentas: { id: string; nombre: string }[]
  categorias: {
    id: string
    nombre: string
    grupo: 'ingreso' | 'negocio' | 'familia'
    clave: import('./calculos').ClaveCategoria | null
  }[]
  obras: { id: string; numero: string; titulo: string; cliente: string }[]
  proveedores: { id: string; nombre: string }[]
  personal: { id: string; nombre: string }[]
}

// ---------------------------------------------------------------- Reportes

export interface ObraSaldo {
  id: string
  numero: string
  titulo: string
  cliente: string
  totalVigente: number
  cobradoNeto: number
  pendiente: number
  exigible: number
  saldoAFavor: number
}

export interface ReporteVentas {
  cantidad: number
  vendido: number
  porVendedor: { personalId: string | null; nombre: string; cantidad: number; vendido: number }[]
}

export interface ReporteCobranzas {
  // Cobros menos devoluciones del período elegido.
  cobradoPeriodo: number
  pendiente: number
  exigibleAhora: number
  anticipos: number
  saldoAFavor: number
  obras: ObraSaldo[]
}

export interface ReporteSeguimientos {
  vencidos: number
  items: {
    conversationId: string
    nombre: string
    fecha: string | null
    nota: string | null
    presupuestoNumero: string | null
    presupuestoTotal: number | null
    presupuestoEnviado: string | null
  }[]
}

export interface ReporteAtrasadas {
  cantidad: number
  // Sin montos: este reporte lo ven también los empleados.
  obras: {
    id: string
    numero: string
    titulo: string
    cliente: string
    etapa: EtapaObra
    fechaEntrega: string
    diasAtraso: number
  }[]
}

export interface ReporteDeudaProveedores {
  deuda: number
  comprometido: number
  aFavor: number
  vencido: number
  proveedores: { id: string; nombre: string; saldo: number; vencido: number; comprometido: number }[]
}

export interface ReporteGanancia {
  ingresos: number
  gastosNegocio: number
  gananciaNegocio: number
  gastosFamilia: number
  netaLibre: number
  // Compras recibidas sin imputar a ninguna obra en el período.
  materialesSinObra: number
  porObra: {
    id: string
    numero: string
    titulo: string
    contrato: number
    costo: number
    margen: number
    entregada: boolean
    cancelada: boolean
  }[]
}

export interface ReporteGastosPorCategoria {
  total: number
  categorias: { id: string; nombre: string; grupo: 'negocio' | 'familia'; total: number }[]
}

export interface ReporteCuentas {
  total: number
  cuentas: { id: string; nombre: string; tipo: TipoCuenta; saldo: number }[]
}

export interface ReporteComisiones {
  pendiente: number
  porPersona: { personalId: string; nombre: string; devengado: number; pagado: number; saldo: number }[]
}

export interface ReportePendientes {
  ventasSinObra: number
  cuotasExigibles: number
  comprasVencidas: number
  tareasVencidas: number
  fijosSinGenerar: number
}

export interface Reportes {
  ventas: ReporteVentas
  cobranzas: ReporteCobranzas
  seguimientos: ReporteSeguimientos
  atrasadas: ReporteAtrasadas
  deudaProveedores: ReporteDeudaProveedores
  ganancia: ReporteGanancia
  gastosPorCategoria: ReporteGastosPorCategoria
  cuentas: ReporteCuentas
  comisiones: ReporteComisiones
  pendientes: ReportePendientes
}
