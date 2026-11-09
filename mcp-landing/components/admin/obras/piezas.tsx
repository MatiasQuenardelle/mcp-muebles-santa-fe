// Piezas sin estado de las pantallas de obras.

import { diasEntre } from '@/lib/gestion/calculos'
import { formatearFecha } from '@/lib/presupuesto'

export function diasDeAtraso(
  obra: { fecha_entrega: string | null; entregada_en: string | null; cancelada_en: string | null },
  hoy: string
): number {
  if (obra.entregada_en !== null || obra.cancelada_en !== null || obra.fecha_entrega === null) {
    return 0
  }
  return obra.fecha_entrega < hoy ? diasEntre(obra.fecha_entrega, hoy) : 0
}

export function Atraso({ dias }: { dias: number }) {
  if (dias <= 0) {
    return null
  }
  return (
    <span className="inline-block rounded-full bg-red-700 text-white text-[11px] font-semibold px-2 py-0.5">
      Atrasada {dias} {dias === 1 ? 'día' : 'días'}
    </span>
  )
}

export function fechaTexto(fecha: string | null, vacio = 'Sin fecha'): string {
  return fecha ? formatearFecha(fecha) : vacio
}
