'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import {
  CLASE_BOTON,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Empty,
  Panel,
} from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import {
  periodoDeGastoFijo,
  rangoMes,
  rangoPeriodo,
  redondear,
  type FrecuenciaGasto,
} from '@/lib/gestion/calculos'
import type { GastoFijoFila, ResultadoCargaFijo } from '@/lib/gestion/caja'
import { esFechaReal } from '@/lib/gestion/entrada'

function etiquetaPeriodo(frecuencia: FrecuenciaGasto, fecha: string): string {
  if (frecuencia === 'mensual') {
    return rangoMes(fecha.slice(0, 7))?.etiqueta ?? ''
  }
  const { desde } = rangoPeriodo('semana_actual', fecha)
  return `Semana del ${desde.slice(8, 10)}/${desde.slice(5, 7)}`
}

// `send` solo devuelve el error, y acá hace falta saber qué pasó con cada gasto.
async function pedirCarga(cuerpo: unknown): Promise<{ resultados?: ResultadoCargaFijo[]; error?: string }> {
  try {
    const respuesta = await fetch('/api/admin/caja/fijos/cargar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
    const datos = (await respuesta.json().catch(() => ({}))) as {
      resultados?: ResultadoCargaFijo[]
      error?: string
    }
    return respuesta.ok ? { resultados: datos.resultados ?? [] } : { error: datos.error ?? 'No se pudo guardar.' }
  } catch {
    return { error: 'No se pudo conectar. Probá de nuevo.' }
  }
}

interface Informe {
  creados: string[]
  yaCargados: string[]
  errores: { nombre: string; mensaje: string }[]
}

export default function CargarFijos({
  gastos,
  cuentas,
  cargados,
  hoy,
}: {
  gastos: GastoFijoFila[]
  cuentas: { id: string; nombre: string }[]
  cargados: string[]
  hoy: string
}) {
  const router = useRouter()
  const [fecha, setFecha] = useState(hoy)
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? '')
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set())
  const [montos, setMontos] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(gastos.map((gasto) => [gasto.id, gasto.monto]))
  )
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [informe, setInforme] = useState<Informe | null>(null)

  const yaCargados = useMemo(() => new Set(cargados), [cargados])
  const fechaValida = esFechaReal(fecha)
  // La misma cuenta que hace el servidor: elegir otra fecha cambia lo que ya está cargado.
  const estaCargado = (gasto: GastoFijoFila) =>
    fechaValida && yaCargados.has(`${gasto.id}:${periodoDeGastoFijo(gasto.frecuencia, fecha)}`)

  const pendientes = gastos.filter((gasto) => !estaCargado(gasto))
  const elegidos = pendientes.filter((gasto) => marcados.has(gasto.id))
  const total = redondear(elegidos.reduce((suma, gasto) => suma + (montos[gasto.id] ?? 0), 0))

  function marcar(id: string, marcado: boolean) {
    setMarcados((previos) => {
      const siguientes = new Set(previos)
      if (marcado) {
        siguientes.add(id)
      } else {
        siguientes.delete(id)
      }
      return siguientes
    })
  }

  async function cargar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) {
      return
    }
    if (!fechaValida) {
      setError('Elegí la fecha.')
      return
    }
    const sinMonto = elegidos.find((gasto) => !montos[gasto.id])
    if (sinMonto) {
      setError(`Revisá el monto de ${sinMonto.nombre}.`)
      return
    }

    setEnviando(true)
    setError(null)
    setInforme(null)
    const { resultados, error: problema } = await pedirCarga({
      fecha,
      cuentaId,
      items: elegidos.map((gasto) => ({ gastoFijoId: gasto.id, monto: montos[gasto.id] })),
    })
    setEnviando(false)
    if (!resultados) {
      setError(problema ?? 'No se pudo guardar.')
      return
    }

    const nombreDe = (id: string) => gastos.find((gasto) => gasto.id === id)?.nombre ?? 'Gasto'
    const conEstado = (estado: ResultadoCargaFijo['estado']) =>
      resultados.filter((resultado) => resultado.estado === estado)
    setInforme({
      creados: conEstado('creado').map((resultado) => nombreDe(resultado.gastoFijoId)),
      yaCargados: conEstado('ya_cargado').map((resultado) => nombreDe(resultado.gastoFijoId)),
      errores: conEstado('error').map((resultado) => ({
        nombre: nombreDe(resultado.gastoFijoId),
        mensaje: resultado.mensaje ?? 'No se pudo cargar.',
      })),
    })
    setMarcados(new Set(conEstado('error').map((resultado) => resultado.gastoFijoId)))
    router.refresh()
  }

  if (gastos.length === 0) {
    return (
      <Panel title="Cargar gastos del período">
        <Empty>Cuando agregues gastos fijos activos, los vas a poder cargar desde acá todos juntos.</Empty>
      </Panel>
    )
  }

  if (cuentas.length === 0) {
    return (
      <Panel title="Cargar gastos del período">
        <Empty>
          Necesitás al menos una cuenta activa.{' '}
          <Link href="/admin/caja/cuentas" className="underline underline-offset-2">
            Creá una acá
          </Link>
          .
        </Empty>
      </Panel>
    )
  }

  return (
    <Panel
      title="Cargar gastos del período"
      action={
        pendientes.length > 0 ? (
          <button
            type="button"
            onClick={() => setMarcados(new Set(pendientes.map((gasto) => gasto.id)))}
            className={CLASE_BOTON_SECUNDARIO}
          >
            Elegir todos
          </button>
        ) : null
      }
    >
      <form onSubmit={cargar} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Fecha">
            <input
              type="date"
              value={fecha}
              required
              onChange={(evento) => setFecha(evento.target.value)}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo label="Sale de">
            <select
              value={cuentaId}
              required
              onChange={(evento) => setCuentaId(evento.target.value)}
              className={CLASE_SELECT}
            >
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <ul className="divide-y divide-brand-border/60">
          {gastos.map((gasto) => {
            const cargado = estaCargado(gasto)
            return (
              <li key={gasto.id} className="py-2.5">
                <label className={`flex items-start gap-3 ${cargado ? '' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={cargado || marcados.has(gasto.id)}
                    disabled={cargado}
                    onChange={(evento) => marcar(gasto.id, evento.target.checked)}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 accent-brand-dark"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold truncate ${cargado ? 'text-brand-muted' : 'text-brand-dark'}`}>
                      {gasto.nombre}
                    </span>
                    <span className="block text-xs text-brand-muted truncate">
                      {cargado ? 'Ya cargado · ' : ''}
                      {fechaValida ? etiquetaPeriodo(gasto.frecuencia, fecha) : ''}
                    </span>
                  </span>
                </label>
                {cargado ? null : (
                  <div className="mt-2 pl-8 max-w-[15rem]">
                    <MoneyInput
                      label="Monto"
                      value={montos[gasto.id] ?? null}
                      onChange={(monto) => {
                        setMontos((previos) => ({ ...previos, [gasto.id]: monto }))
                        marcar(gasto.id, true)
                      }}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {error ? <p className={CLASE_ERROR}>{error}</p> : null}

        {informe ? (
          <div role="status" className="space-y-1 text-sm">
            {informe.creados.length > 0 ? (
              <p className="text-green-700">Cargados: {informe.creados.join(', ')}.</p>
            ) : null}
            {informe.yaCargados.length > 0 ? (
              <p className="text-brand-muted">Ya estaban cargados en este período: {informe.yaCargados.join(', ')}.</p>
            ) : null}
            {informe.errores.map((fallo) => (
              <p key={fallo.nombre} className={CLASE_ERROR}>
                {fallo.nombre}: {fallo.mensaje}
              </p>
            ))}
          </div>
        ) : null}

        <button type="submit" disabled={enviando || elegidos.length === 0} className={CLASE_BOTON}>
          {enviando
            ? 'Cargando…'
            : pendientes.length === 0
              ? 'Ya está todo cargado en este período'
              : elegidos.length === 0
                ? 'Elegí qué cargar'
                : `Cargar ${elegidos.length === 1 ? '1 gasto' : `${elegidos.length} gastos`} · ${formatMoney(total)}`}
        </button>
      </form>
    </Panel>
  )
}
