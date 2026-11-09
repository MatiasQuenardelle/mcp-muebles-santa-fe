'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import { CLASE_BOTON, CLASE_ERROR, CLASE_INPUT, CLASE_SELECT, Campo } from '@/components/admin/gestion/ui'
import { todayKey } from '@/lib/adminFormat'
import type { Vendedor } from '@/lib/gestion/obras'
import { ETAPAS_OBRA, ETAPA_LABELS, type EtapaObra } from '@/lib/gestion/tipos'
import { crearObraRequest } from './api'
import CamposVendedor, { textoAPct } from './CamposVendedor'

export default function NuevaObraForm({ vendedores }: { vendedores: Vendedor[] }) {
  const router = useRouter()
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [titulo, setTitulo] = useState('')
  const [zona, setZona] = useState('')
  const [etapa, setEtapa] = useState<EtapaObra>('medicion')
  const [total, setTotal] = useState<number | null>(null)
  // Arranca en cero y no vacío: MoneyInput da null tanto si está vacío como si lo
  // escrito no se entiende, y un monto ilegible no puede guardarse como "nada".
  const [cobradoInicial, setCobradoInicial] = useState<number | null>(0)
  const [fechaVenta, setFechaVenta] = useState(todayKey())
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
    if (total === null || total <= 0) {
      setError('Escribí el total del contrato.')
      return
    }
    if (cobradoInicial === null) {
      setError('Escribí cuánto ya se cobró (0 si todavía nada).')
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
      cliente,
      telefono: telefono || null,
      titulo,
      zona: zona || null,
      etapa,
      total,
      cobradoInicial,
      fechaVenta,
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
    <form onSubmit={crear} className="bg-white rounded-2xl border border-brand-border p-4 space-y-3">
      <Campo label="Cliente">
        <input
          type="text"
          value={cliente}
          required
          maxLength={120}
          onChange={(evento) => setCliente(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Teléfono (opcional)">
          <input
            type="tel"
            value={telefono}
            maxLength={40}
            onChange={(evento) => setTelefono(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo label="Zona (opcional)">
          <input
            type="text"
            value={zona}
            maxLength={120}
            onChange={(evento) => setZona(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
      <Campo label="Título">
        <input
          type="text"
          value={titulo}
          required
          maxLength={200}
          placeholder="Cocina en L, placard del dormitorio…"
          onChange={(evento) => setTitulo(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <Campo label="En qué etapa está">
        <select
          value={etapa}
          onChange={(evento) => setEtapa(evento.target.value as EtapaObra)}
          className={CLASE_SELECT}
        >
          {ETAPAS_OBRA.map((opcion) => (
            <option key={opcion} value={opcion}>
              {ETAPA_LABELS[opcion]}
            </option>
          ))}
        </select>
      </Campo>
      <MoneyInput label="Total del contrato" value={total} onChange={setTotal} />
      <div>
        <MoneyInput label="Ya cobrado antes de usar el panel" value={cobradoInicial} onChange={setCobradoInicial} />
        <p className="text-[11px] text-brand-muted mt-1">
          Lo que entre de ahora en adelante se carga como cobro desde la obra.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Fecha de venta">
          <input
            type="date"
            value={fechaVenta}
            required
            onChange={(evento) => setFechaVenta(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo label="Entrega (si se sabe)">
          <input
            type="date"
            value={fechaEntrega}
            onChange={(evento) => setFechaEntrega(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
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
