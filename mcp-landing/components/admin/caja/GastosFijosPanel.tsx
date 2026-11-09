'use client'

import { useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import {
  CLASE_BOTON,
  CLASE_BOTON_PILL,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Empty,
  Panel,
} from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import type { FrecuenciaGasto } from '@/lib/gestion/calculos'
import type { CategoriaFila, GastoFijoFila } from '@/lib/gestion/caja'
import { useEnvio } from './useEnvio'

const FRECUENCIA_LABELS: Record<FrecuenciaGasto, string> = { semanal: 'Semanal', mensual: 'Mensual' }

function FormGasto({
  gasto,
  categorias,
  onCerrar,
}: {
  gasto: GastoFijoFila | null
  categorias: CategoriaFila[]
  onCerrar: () => void
}) {
  const { enviando, error, setError, enviar } = useEnvio()
  const [nombre, setNombre] = useState(gasto?.nombre ?? '')
  const [categoriaId, setCategoriaId] = useState(gasto?.categoria_id ?? '')
  const [monto, setMonto] = useState<number | null>(gasto?.monto ?? null)
  const [frecuencia, setFrecuencia] = useState<FrecuenciaGasto>(gasto?.frecuencia ?? 'mensual')

  // Las mismas que acepta la API. La actual se suma aunque ya no aplique, si no el
  // select mostraría otra distinta de la guardada.
  const aptas = categorias.filter(
    (categoria) =>
      categoria.id === gasto?.categoria_id ||
      (categoria.activa && categoria.clave === null && categoria.grupo !== 'ingreso')
  )

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) {
      return
    }
    if (monto === null || monto <= 0) {
      setError('Escribí el monto.')
      return
    }
    const cuerpo = { nombre, categoriaId, monto, frecuencia }
    const listo = gasto
      ? await enviar('PATCH', `/api/admin/caja/fijos/${gasto.id}`, cuerpo)
      : await enviar('POST', '/api/admin/caja/fijos', cuerpo)
    if (listo) {
      onCerrar()
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3 max-w-2xl">
      <Campo label="Nombre">
        <input
          type="text"
          value={nombre}
          required
          maxLength={120}
          onChange={(evento) => setNombre(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <Campo label="Categoría">
        <select
          value={categoriaId}
          required
          onChange={(evento) => setCategoriaId(evento.target.value)}
          className={CLASE_SELECT}
        >
          <option value="">Elegir…</option>
          {(['negocio', 'familia'] as const).map((grupo) => (
            <optgroup key={grupo} label={grupo === 'negocio' ? 'Negocio' : 'Familia'}>
              {aptas
                .filter((categoria) => categoria.grupo === grupo)
                .map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                    {categoria.activa ? '' : ' (dada de baja)'}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <MoneyInput label="Monto" value={monto} onChange={setMonto} />
        <Campo label="Frecuencia">
          <select
            value={frecuencia}
            onChange={(evento) => setFrecuencia(evento.target.value as FrecuenciaGasto)}
            className={CLASE_SELECT}
          >
            <option value="mensual">Mensual</option>
            <option value="semanal">Semanal</option>
          </select>
        </Campo>
      </div>
      {gasto && frecuencia !== gasto.frecuencia ? (
        <p className="text-xs text-brand-muted">
          Lo que ya cargaste con la frecuencia anterior no cuenta para el período nuevo: fijate que no quede doble.
        </p>
      ) : null}
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <button type="submit" disabled={enviando} className={CLASE_BOTON}>
        {enviando ? 'Guardando…' : 'Guardar gasto fijo'}
      </button>
      <button type="button" onClick={onCerrar} className={CLASE_BOTON_SECUNDARIO}>
        Volver
      </button>
    </form>
  )
}

export default function GastosFijosPanel({
  gastos,
  categorias,
}: {
  gastos: GastoFijoFila[]
  categorias: CategoriaFila[]
}) {
  const { enviando, error, enviar } = useEnvio()
  const [editando, setEditando] = useState<string | null>(null)

  async function borrar(gasto: GastoFijoFila) {
    if (window.confirm(`¿Borrar "${gasto.nombre}"? Lo que ya se cargó queda en la caja.`)) {
      await enviar('DELETE', `/api/admin/caja/fijos/${gasto.id}`)
    }
  }

  return (
    <Panel
      title="Gastos fijos"
      action={
        editando === 'nuevo' ? null : (
          <button type="button" onClick={() => setEditando('nuevo')} className={CLASE_BOTON_PILL}>
            + Nuevo gasto
          </button>
        )
      }
    >
      {editando === 'nuevo' ? (
        <div className="mb-3">
          <FormGasto gasto={null} categorias={categorias} onCerrar={() => setEditando(null)} />
        </div>
      ) : null}

      {error ? <p className={`${CLASE_ERROR} mb-2`}>{error}</p> : null}

      {gastos.length === 0 ? (
        <Empty>Todavía no hay gastos fijos. Agregá los que se repiten todos los meses o semanas, como el alquiler.</Empty>
      ) : (
        <ul className="divide-y divide-brand-border/60">
          {gastos.map((gasto) => (
            <li key={gasto.id} className="py-2.5">
              {editando === gasto.id ? (
                <FormGasto gasto={gasto} categorias={categorias} onCerrar={() => setEditando(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${gasto.activo ? 'text-brand-dark' : 'text-brand-muted'}`}>
                        {gasto.nombre}
                      </div>
                      <div className="text-xs text-brand-muted truncate">
                        {gasto.grupo === 'familia' ? 'Familia' : 'Negocio'} · {gasto.categoria_nombre} ·{' '}
                        {gasto.activo ? FRECUENCIA_LABELS[gasto.frecuencia] : 'Dado de baja'}
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-brand-dark flex-shrink-0">
                      {formatMoney(gasto.monto)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => setEditando(gasto.id)} className={CLASE_BOTON_SECUNDARIO}>
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => enviar('PATCH', `/api/admin/caja/fijos/${gasto.id}`, { activo: !gasto.activo })}
                      className={CLASE_BOTON_SECUNDARIO}
                    >
                      {gasto.activo ? 'Dar de baja' : 'Reactivar'}
                    </button>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => borrar(gasto)}
                      className={CLASE_BOTON_SECUNDARIO}
                    >
                      Borrar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
