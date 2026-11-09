'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CLASE_BOTON,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
  CLASE_INPUT,
  Campo,
} from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import { todayKey } from '@/lib/adminFormat'
import type { EstadoCompra } from '@/lib/gestion/tipos'

export default function CompraAcciones({
  id,
  estado,
  fecha,
  comprobante,
  venceEl,
  proveedorNombre,
}: {
  id: string
  estado: EstadoCompra
  fecha: string
  comprobante: string | null
  venceEl: string | null
  proveedorNombre: string
}) {
  const router = useRouter()
  const hoy = todayKey()
  const [abierto, setAbierto] = useState<'recibir' | 'cancelar' | null>(null)
  const [recibidaEn, setRecibidaEn] = useState(hoy)
  const [numero, setNumero] = useState(comprobante ?? '')
  const [vence, setVence] = useState(venceEl ?? '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (estado === 'cancelado') {
    return null
  }

  async function enviar(cuerpo: Record<string, unknown>) {
    if (enviando) {
      return
    }
    setEnviando(true)
    setError(null)
    const problema = await send('PATCH', `/api/admin/compras/${id}`, cuerpo)
    setEnviando(false)
    if (problema) {
      setError(problema)
      return
    }
    setAbierto(null)
    router.refresh()
  }

  function recibir() {
    if (!recibidaEn) {
      setError('Elegí la fecha.')
      return
    }
    if (vence && vence < fecha) {
      setError('El vencimiento no puede ser anterior a la fecha de la compra.')
      return
    }
    enviar({ accion: 'recibir', recibidaEn, comprobante: numero.trim() || null, venceEl: vence || null })
  }

  function abrir(cual: 'recibir' | 'cancelar') {
    setAbierto(cual)
    setError(null)
  }

  return (
    <div className="space-y-3">
      {estado === 'pedido' && abierto !== 'recibir' ? (
        <button type="button" onClick={() => abrir('recibir')} className={CLASE_BOTON}>
          Marcar recibida
        </button>
      ) : null}

      {abierto === 'recibir' ? (
        <div className="rounded-2xl border border-brand-border bg-white p-4 space-y-3">
          <p className="text-sm text-brand-dark">
            Desde que la marques suma a la deuda con {proveedorNombre} y al costo de las obras, y ya no se puede editar.
            Revisá la factura y el vencimiento.
          </p>
          <Campo label="Fecha en que llegó">
            <input
              type="date"
              value={recibidaEn}
              max={hoy}
              onChange={(evento) => setRecibidaEn(evento.target.value)}
              className={`${CLASE_INPUT} min-w-0`}
            />
          </Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="N° de factura">
              <input
                type="text"
                value={numero}
                maxLength={100}
                autoComplete="off"
                onChange={(evento) => setNumero(evento.target.value)}
                className={CLASE_INPUT}
              />
            </Campo>
            <Campo label="Vence">
              <input
                type="date"
                value={vence}
                min={fecha}
                onChange={(evento) => setVence(evento.target.value)}
                className={`${CLASE_INPUT} min-w-0`}
              />
            </Campo>
          </div>
          {error ? <p className={CLASE_ERROR}>{error}</p> : null}
          <button type="button" disabled={enviando} onClick={recibir} className={CLASE_BOTON}>
            {enviando ? 'Guardando…' : 'Confirmar recepción'}
          </button>
          <button type="button" onClick={() => setAbierto(null)} className={CLASE_BOTON_SECUNDARIO}>
            Volver
          </button>
        </div>
      ) : null}

      {abierto === 'cancelar' ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm text-red-800">
            {estado === 'recibido'
              ? `Deja de sumar a la deuda con ${proveedorNombre} y al costo de las obras. Si ya le pagaste, ese pago queda a tu favor. No se puede deshacer.`
              : 'Se cancela el pedido y no suma a ninguna cuenta. No se puede deshacer.'}
          </p>
          {error ? <p className={CLASE_ERROR}>{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={() => enviar({ accion: 'cancelar' })}
              className="rounded-full bg-red-700 text-white text-xs font-semibold px-4 py-2 disabled:opacity-40"
            >
              {enviando ? 'Cancelando…' : 'Sí, cancelar la compra'}
            </button>
            <button type="button" onClick={() => setAbierto(null)} className={CLASE_BOTON_SECUNDARIO}>
              Volver
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {estado === 'pedido' ? (
            <Link href={`/admin/compras/${id}/editar`} className={CLASE_BOTON_SECUNDARIO}>
              Editar pedido
            </Link>
          ) : null}
          <button type="button" onClick={() => abrir('cancelar')} className={CLASE_BOTON_SECUNDARIO}>
            Cancelar compra
          </button>
        </div>
      )}
    </div>
  )
}
