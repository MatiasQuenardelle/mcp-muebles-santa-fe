'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import {
  CLASE_BOTON,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
  CLASE_ERROR,
  CLASE_INPUT,
  Campo,
} from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import { todayKey } from '@/lib/adminFormat'

export default function AjusteForm({ obraId }: { obraId: string }) {
  const router = useRouter()
  // MoneyInput no acepta signo: el sentido se elige acá.
  const [signo, setSigno] = useState<1 | -1>(1)
  const [monto, setMonto] = useState<number | null>(null)
  const [fecha, setFecha] = useState(todayKey())
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Se renueva solo después de guardar bien, como en MovimientoForm.
  const idRef = useRef<string>(crypto.randomUUID())

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    if (monto === null || monto <= 0) {
      setError('Escribí el monto.')
      return
    }
    setGuardando(true)
    setError(null)
    const problema = await send('POST', `/api/admin/obras/${obraId}/ajustes`, {
      id: idRef.current,
      fecha,
      monto: signo * monto,
      motivo,
    })
    setGuardando(false)
    if (problema) {
      setError(problema)
      return
    }
    idRef.current = crypto.randomUUID()
    setMonto(null)
    setMotivo('')
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            [1, 'Adicional'],
            [-1, 'Descuento'],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setSigno(valor)}
            className={`rounded-xl border py-2 text-xs font-semibold ${
              signo === valor ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MoneyInput label="Monto" value={monto} onChange={setMonto} />
        <Campo label="Fecha">
          <input
            type="date"
            value={fecha}
            required
            onChange={(evento) => setFecha(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
      <Campo label="Motivo">
        <input
          type="text"
          value={motivo}
          required
          maxLength={300}
          placeholder="Se agregó una alacena, descuento por pago contado…"
          onChange={(evento) => setMotivo(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <button type="submit" disabled={guardando} className={CLASE_BOTON}>
        {guardando ? 'Guardando…' : 'Cargar ajuste'}
      </button>
    </form>
  )
}
