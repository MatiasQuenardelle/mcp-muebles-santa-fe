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
  Tile,
} from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import type { CuentaFila } from '@/lib/gestion/caja'
import { TIPO_CUENTA_LABELS, type TipoCuenta } from '@/lib/gestion/tipos'
import { useEnvio } from './useEnvio'

type CuentaConSaldo = CuentaFila & { saldo: number }

const TIPOS = Object.keys(TIPO_CUENTA_LABELS) as TipoCuenta[]

function FormCuenta({ cuenta, onCerrar }: { cuenta: CuentaConSaldo | null; onCerrar: () => void }) {
  const { enviando, error, setError, enviar } = useEnvio()
  const [nombre, setNombre] = useState(cuenta?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta?.tipo ?? 'efectivo')
  const [saldoInicial, setSaldoInicial] = useState<number | null>(cuenta?.saldo_inicial ?? 0)

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) {
      return
    }
    // MoneyInput da null tanto si está vacío como si no se pudo leer: nunca asumir cero.
    if (saldoInicial === null) {
      setError('Revisá el saldo inicial. Si arranca vacía, poné 0.')
      return
    }
    const cuerpo = { nombre, tipo, saldoInicial }
    const listo = cuenta
      ? await enviar('PATCH', `/api/admin/caja/cuentas/${cuenta.id}`, cuerpo)
      : await enviar('POST', '/api/admin/caja/cuentas', cuerpo)
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
          maxLength={80}
          onChange={(evento) => setNombre(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Tipo">
          <select
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value as TipoCuenta)}
            className={CLASE_SELECT}
          >
            {TIPOS.map((opcion) => (
              <option key={opcion} value={opcion}>
                {TIPO_CUENTA_LABELS[opcion]}
              </option>
            ))}
          </select>
        </Campo>
        <MoneyInput label="Saldo inicial" value={saldoInicial} onChange={setSaldoInicial} />
      </div>
      <p className="text-xs text-brand-muted">
        El saldo inicial es lo que había el día que empezaste a usar el panel. Cambiarlo mueve el saldo de hoy.
      </p>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <button type="submit" disabled={enviando} className={CLASE_BOTON}>
        {enviando ? 'Guardando…' : 'Guardar cuenta'}
      </button>
      <button type="button" onClick={onCerrar} className={CLASE_BOTON_SECUNDARIO}>
        Volver
      </button>
    </form>
  )
}

export default function CuentasPanel({ cuentas, total }: { cuentas: CuentaConSaldo[]; total: number }) {
  const { enviando, error, enviar } = useEnvio()
  const [editando, setEditando] = useState<string | null>(null)

  async function cambiarActiva(cuenta: CuentaConSaldo) {
    if (cuenta.activa) {
      const aviso =
        cuenta.saldo !== 0
          ? `"${cuenta.nombre}" todavía tiene ${formatMoney(cuenta.saldo)}. Esa plata va a seguir sumando en el total y no vas a poder moverla mientras esté de baja. ¿Darla de baja igual?`
          : `¿Dar de baja "${cuenta.nombre}"? Deja de aparecer al cargar movimientos.`
      if (!window.confirm(aviso)) {
        return
      }
    }
    await enviar('PATCH', `/api/admin/caja/cuentas/${cuenta.id}`, { activa: !cuenta.activa })
  }

  return (
    <Panel
      title="Cuentas"
      action={
        editando === 'nueva' ? null : (
          <button type="button" onClick={() => setEditando('nueva')} className={CLASE_BOTON_PILL}>
            + Nueva cuenta
          </button>
        )
      }
    >
      <div className="mb-3">
        <Tile label="Saldo total" value={formatMoney(total)} tono={total < 0 ? 'alerta' : 'normal'} />
      </div>

      {editando === 'nueva' ? (
        <div className="mb-3">
          <FormCuenta cuenta={null} onCerrar={() => setEditando(null)} />
        </div>
      ) : null}

      {error ? <p className={`${CLASE_ERROR} mb-2`}>{error}</p> : null}

      {cuentas.length === 0 ? (
        <Empty>Todavía no hay cuentas. Creá la primera: la caja de efectivo, el banco o Mercado Pago.</Empty>
      ) : (
        <ul className="divide-y divide-brand-border/60">
          {cuentas.map((cuenta) => (
            <li key={cuenta.id} className="py-2.5">
              {editando === cuenta.id ? (
                <FormCuenta cuenta={cuenta} onCerrar={() => setEditando(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${cuenta.activa ? 'text-brand-dark' : 'text-brand-muted'}`}>
                        {cuenta.nombre}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {cuenta.activa ? TIPO_CUENTA_LABELS[cuenta.tipo] : 'Dada de baja'} · inicial{' '}
                        {formatMoney(cuenta.saldo_inicial)}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                        cuenta.saldo < 0 ? 'text-red-700' : 'text-brand-dark'
                      }`}
                    >
                      {formatMoney(cuenta.saldo)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <button type="button" onClick={() => setEditando(cuenta.id)} className={CLASE_BOTON_SECUNDARIO}>
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => cambiarActiva(cuenta)}
                      className={CLASE_BOTON_SECUNDARIO}
                    >
                      {cuenta.activa ? 'Dar de baja' : 'Reactivar'}
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
