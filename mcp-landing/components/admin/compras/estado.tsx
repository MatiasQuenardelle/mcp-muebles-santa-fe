// Cómo se muestran los estados de una compra. Sin estado propio: sirve en server
// components y en cliente.

import type { CompraSaldo } from '@/lib/gestion/calculos'
import { ESTADO_COMPRA_LABELS, type EstadoCompra } from '@/lib/gestion/tipos'

export function fechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(2, 4)}`
}

const BADGE = 'inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap'

const ESTILOS_ESTADO: Record<EstadoCompra, string> = {
  pedido: 'bg-blue-50 text-blue-800 border-blue-200',
  recibido: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelado: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

export function BadgeEstado({ estado }: { estado: EstadoCompra }) {
  return <span className={`${BADGE} ${ESTILOS_ESTADO[estado]}`}>{ESTADO_COMPRA_LABELS[estado]}</span>
}

// Vencida gana sobre parcial e impaga: es lo primero que hay que ver.
function presentacionPago(pago: CompraSaldo): { label: string; estilo: string } {
  if (pago.vencida) {
    return { label: 'Vencida', estilo: 'bg-red-50 text-red-700 border-red-200' }
  }
  if (pago.estado === 'pagada') {
    return { label: 'Pagada', estilo: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  }
  if (pago.estado === 'parcial') {
    return { label: 'Parcial', estilo: 'bg-amber-50 text-amber-800 border-amber-200' }
  }
  return { label: 'Impaga', estilo: 'bg-white text-brand-muted border-brand-border' }
}

export function BadgePago({ pago }: { pago: CompraSaldo }) {
  const { label, estilo } = presentacionPago(pago)
  return <span className={`${BADGE} ${estilo}`}>{label}</span>
}
