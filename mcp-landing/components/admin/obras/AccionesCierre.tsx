'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import { formatMoney } from '@/lib/adminFormat'

type Accion = 'entregar' | 'cancelar'

export default function AccionesCierre({
  obraId,
  pendiente,
  cobrado,
}: {
  obraId: string
  pendiente: number
  cobrado: number
}) {
  const router = useRouter()
  const [accion, setAccion] = useState<Accion | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar(elegida: Accion) {
    if (enviando) {
      return
    }
    setEnviando(true)
    setError(null)
    const problema = await send('POST', `/api/admin/obras/${obraId}/${elegida}`)
    setEnviando(false)
    if (problema) {
      setError(problema)
      return
    }
    setAccion(null)
    router.refresh()
  }

  if (accion === null) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAccion('entregar')}
          className="rounded-full bg-brand-dark text-brand-gold text-sm font-semibold px-4 py-2"
        >
          Marcar como entregada
        </button>
        <button
          type="button"
          onClick={() => setAccion('cancelar')}
          className="rounded-full border border-red-300 bg-white text-red-700 text-sm font-semibold px-4 py-2"
        >
          Cancelar obra
        </button>
      </div>
    )
  }

  const entregar = accion === 'entregar'
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
      <p className="text-sm font-semibold text-brand-dark">
        {entregar ? '¿Confirmás que la obra se entregó hoy?' : '¿Confirmás que querés cancelar esta obra?'}
      </p>
      <p className="text-xs text-brand-muted">
        {entregar
          ? `Sale del tablero de obras en curso y no se puede deshacer.${
              pendiente > 0 ? ` Todavía falta cobrar ${formatMoney(pendiente)}, que pasa a poder reclamarse.` : ''
            }`
          : `Deja de contar como venta y no se puede deshacer.${
              cobrado > 0
                ? ` Ya se cobraron ${formatMoney(cobrado)}: si hay que devolver plata, cargá la devolución acá mismo.`
                : ''
            }`}
      </p>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={() => confirmar(accion)}
          className="rounded-full bg-red-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
        >
          {enviando ? 'Guardando…' : entregar ? 'Sí, se entregó' : 'Sí, cancelar la obra'}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => {
            setAccion(null)
            setError(null)
          }}
          className={CLASE_BOTON_SECUNDARIO}
        >
          Volver
        </button>
      </div>
    </div>
  )
}
