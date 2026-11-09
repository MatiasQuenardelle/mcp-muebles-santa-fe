'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR, CLASE_INPUT, Empty } from '@/components/admin/gestion/ui'
import { anularMovimientoRequest } from '@/lib/adminApi'
import { formatMoney } from '@/lib/adminFormat'
import type { MovimientoFila } from '@/lib/gestion/tipos'

function concepto(movimiento: MovimientoFila): string {
  if (movimiento.tipo === 'transferencia') {
    return `${movimiento.cuenta_nombre} → ${movimiento.cuenta_destino_nombre ?? ''}`
  }
  const detalle = movimiento.obra_titulo ?? movimiento.proveedor_nombre ?? movimiento.personal_nombre
  return detalle ? `${movimiento.categoria_nombre} · ${detalle}` : (movimiento.categoria_nombre ?? '')
}

function fechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`
}

export default function ListaMovimientos({
  movimientos,
  vacio = 'Todavía no hay movimientos.',
  puedeAnular = true,
}: {
  movimientos: MovimientoFila[]
  vacio?: string
  puedeAnular?: boolean
}) {
  const router = useRouter()
  const [anulandoId, setAnulandoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function confirmar(id: string) {
    if (!motivo.trim()) {
      setError('Escribí por qué se anula.')
      return
    }
    setEnviando(true)
    const problema = await anularMovimientoRequest(id, motivo.trim())
    setEnviando(false)
    if (problema) {
      setError(problema)
      return
    }
    setAnulandoId(null)
    setMotivo('')
    setError(null)
    router.refresh()
  }

  if (movimientos.length === 0) {
    return <Empty>{vacio}</Empty>
  }

  return (
    <ul className="divide-y divide-brand-border/60">
      {movimientos.map((movimiento) => {
        const anulado = movimiento.anulado_en !== null
        const signo = movimiento.tipo === 'ingreso' ? '+' : movimiento.tipo === 'egreso' ? '−' : ''
        return (
          <li key={movimiento.id} className="py-2">
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-brand-muted tabular-nums pt-0.5 flex-shrink-0">
                {fechaCorta(movimiento.fecha)}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm truncate ${anulado ? 'text-brand-muted line-through' : 'text-brand-dark'}`}>
                  {concepto(movimiento)}
                </div>
                <div className="text-xs text-brand-muted truncate">
                  {movimiento.tipo === 'transferencia' ? 'Transferencia' : movimiento.cuenta_nombre}
                  {movimiento.nota ? ` · ${movimiento.nota}` : ''}
                  {anulado ? ` · Anulado: ${movimiento.anulado_motivo}` : ''}
                </div>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                  anulado
                    ? 'text-brand-muted line-through'
                    : movimiento.tipo === 'ingreso'
                      ? 'text-green-700'
                      : 'text-brand-dark'
                }`}
              >
                {signo} {formatMoney(movimiento.monto)}
              </span>
            </div>
            {puedeAnular && !anulado ? (
              anulandoId === movimiento.id ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={motivo}
                    placeholder="Motivo (obligatorio)"
                    maxLength={300}
                    onChange={(evento) => setMotivo(evento.target.value)}
                    className={CLASE_INPUT}
                  />
                  {error ? <p className={CLASE_ERROR}>{error}</p> : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => confirmar(movimiento.id)}
                      className="rounded-full bg-red-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
                    >
                      Confirmar anulación
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnulandoId(null)
                        setError(null)
                      }}
                      className={CLASE_BOTON_SECUNDARIO}
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAnulandoId(movimiento.id)
                    setMotivo('')
                    setError(null)
                  }}
                  className="mt-0.5 ml-10 text-[11px] text-brand-muted underline underline-offset-2"
                >
                  Anular
                </button>
              )
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
