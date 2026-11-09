'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import { CLASE_BOTON, CLASE_ERROR, CLASE_ETIQUETA, CLASE_INPUT, Campo } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import type { Vendedor } from '@/lib/gestion/obras'
import { crearObraRequest } from './api'
import CamposVendedor, { textoAPct } from './CamposVendedor'

export interface PresupuestoOpcion {
  id: string
  numero: string
  total: number
  detalle: string
}

export default function CrearObraContactoForm({
  conversationId,
  presupuestos,
  vendedores,
}: {
  conversationId: string
  // El primero es el que viene elegido.
  presupuestos: PresupuestoOpcion[]
  vendedores: Vendedor[]
}) {
  const router = useRouter()
  const [presupuestoId, setPresupuestoId] = useState(presupuestos[0]?.id ?? '')
  const [total, setTotal] = useState<number | null>(null)
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [comision, setComision] = useState('0')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function crear(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    if (!presupuestoId && (total === null || total <= 0)) {
      setError('Escribí el total de la venta.')
      return
    }
    const comisionPct = vendedorId ? textoAPct(comision) : 0
    if (comisionPct === null) {
      setError('Comisión: escribí un número entre 0 y 100.')
      return
    }

    setGuardando(true)
    setError(null)
    const resultado = await crearObraRequest({
      conversationId,
      presupuestoId: presupuestoId || null,
      total: presupuestoId ? null : total,
      fechaEntrega: fechaEntrega || null,
      vendedorId: vendedorId || null,
      comisionPct,
    })
    if ('error' in resultado) {
      setGuardando(false)
      setError(resultado.error)
      return
    }
    router.push(`/admin/obras/${resultado.id}`)
  }

  return (
    <form onSubmit={crear} className="space-y-3">
      {presupuestos.length > 0 ? (
        <fieldset className="space-y-1.5 min-w-0">
          <legend className={CLASE_ETIQUETA}>Presupuesto vendido</legend>
          {presupuestos.map((presupuesto) => (
            <label
              key={presupuesto.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                presupuestoId === presupuesto.id
                  ? 'border-brand-gold bg-brand-cream'
                  : 'border-brand-border bg-white'
              }`}
            >
              <input
                type="radio"
                name="presupuesto"
                checked={presupuestoId === presupuesto.id}
                onChange={() => setPresupuestoId(presupuesto.id)}
                className="flex-shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-brand-dark">
                  N° {presupuesto.numero} · {formatMoney(presupuesto.total)}
                </span>
                <span className="block text-[11px] text-brand-muted truncate">{presupuesto.detalle}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <MoneyInput label="Total de la venta" value={total} onChange={setTotal} />
      )}

      <Campo label="Fecha de entrega (si ya está acordada)">
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

      {error ? <p className={CLASE_ERROR}>{error}</p> : null}

      <button type="submit" disabled={guardando} className={CLASE_BOTON}>
        {guardando ? 'Creando…' : 'Crear obra'}
      </button>
    </form>
  )
}
