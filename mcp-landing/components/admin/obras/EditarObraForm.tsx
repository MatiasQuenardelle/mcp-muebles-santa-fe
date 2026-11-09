'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CLASE_BOTON, CLASE_ERROR, CLASE_INPUT, Campo } from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import type { Vendedor } from '@/lib/gestion/obras'
import CamposVendedor, { pctATexto, textoAPct } from './CamposVendedor'

export default function EditarObraForm({
  obraId,
  fechaEntregaInicial,
  notasIniciales,
  vendedorIdInicial,
  comisionInicial,
  vendedores,
}: {
  obraId: string
  fechaEntregaInicial: string | null
  notasIniciales: string | null
  vendedorIdInicial: string | null
  comisionInicial: number
  vendedores: Vendedor[]
}) {
  const router = useRouter()
  const [fechaEntrega, setFechaEntrega] = useState(fechaEntregaInicial ?? '')
  const [notas, setNotas] = useState(notasIniciales ?? '')
  const [vendedorId, setVendedorId] = useState(vendedorIdInicial ?? '')
  const [comision, setComision] = useState(pctATexto(comisionInicial))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    const comisionPct = vendedorId ? textoAPct(comision) : 0
    if (comisionPct === null) {
      setError('Comisión: escribí un número entre 0 y 100.')
      return
    }
    setGuardando(true)
    setError(null)
    setGuardado(false)
    const problema = await send('PATCH', `/api/admin/obras/${obraId}`, {
      fechaEntrega: fechaEntrega || null,
      notas,
      vendedorId: vendedorId || null,
      comisionPct,
    })
    setGuardando(false)
    if (problema) {
      setError(problema)
      return
    }
    setGuardado(true)
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <Campo label="Fecha de entrega">
        <input
          type="date"
          value={fechaEntrega}
          onChange={(evento) => setFechaEntrega(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <CamposVendedor
        vendedores={vendedores}
        vendedorId={vendedorId}
        comision={comision}
        onVendedor={(id, sugerida) => {
          setVendedorId(id)
          setComision(sugerida)
        }}
        onComision={setComision}
      />
      <Campo label="Notas">
        <textarea
          value={notas}
          rows={3}
          maxLength={2000}
          onChange={(evento) => setNotas(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      {guardado ? <p className="text-sm text-green-700">Guardado.</p> : null}
      <button type="submit" disabled={guardando} className={CLASE_BOTON}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
