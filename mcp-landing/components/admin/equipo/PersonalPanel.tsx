'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { send } from '@/lib/adminApi'
import type { CuentaPanel, PersonaFila } from '@/lib/gestion/equipo'

function PersonaForm({
  persona,
  cuentasLibres,
  onListo,
}: {
  persona?: PersonaFila
  cuentasLibres: CuentaPanel[]
  onListo: () => void
}) {
  const router = useRouter()
  const [nombre, setNombre] = useState(persona?.nombre ?? '')
  const [puesto, setPuesto] = useState(persona?.puesto ?? '')
  const [telefono, setTelefono] = useState(persona?.telefono ?? '')
  const [userId, setUserId] = useState(persona?.user_id ?? '')
  const [comision, setComision] = useState(persona ? String(persona.comision_pct).replace('.', ',') : '0')
  const [activo, setActivo] = useState(persona?.activo ?? true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // La cuenta que ya tiene no figura entre las libres, pero tiene que poder conservarla.
  const cuentas = persona?.user_id
    ? [{ id: persona.user_id, name: persona.cuenta_nombre ?? 'Cuenta vinculada' }, ...cuentasLibres]
    : cuentasLibres

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    setGuardando(true)
    setError(null)
    const cuerpo = {
      nombre,
      puesto,
      telefono,
      userId: userId || null,
      comisionPct: Number(comision.trim().replace(',', '.') || '0'),
      activo,
    }
    const problema = persona
      ? await send('PATCH', `/api/admin/equipo/personal/${persona.id}`, cuerpo)
      : await send('POST', '/api/admin/equipo/personal', cuerpo)
    setGuardando(false)
    if (problema) {
      setError(problema)
      return
    }
    onListo()
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Campo label="Puesto">
          <input
            type="text"
            value={puesto}
            maxLength={120}
            placeholder="Vendedor, armador, colocador…"
            onChange={(evento) => setPuesto(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo label="Teléfono">
          <input
            type="tel"
            value={telefono}
            maxLength={40}
            onChange={(evento) => setTelefono(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Campo label="Cuenta del panel">
          <select value={userId} onChange={(evento) => setUserId(evento.target.value)} className={CLASE_SELECT}>
            <option value="">Sin cuenta en el panel</option>
            {cuentas.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.name}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Comisión por defecto (%)">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={comision}
            onChange={(evento) => setComision(evento.target.value)}
            className={`${CLASE_INPUT} tabular-nums`}
          />
        </Campo>
      </div>
      {persona ? (
        <label className="flex items-center gap-2 text-sm text-brand-dark">
          <input
            type="checkbox"
            checked={activo}
            onChange={(evento) => setActivo(evento.target.checked)}
            className="w-5 h-5 accent-brand-dark"
          />
          Sigue trabajando en la empresa
        </label>
      ) : null}
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={guardando} className={CLASE_BOTON}>
          {guardando ? 'Guardando…' : persona ? 'Guardar cambios' : 'Agregar persona'}
        </button>
        <button type="button" onClick={onListo} className={`${CLASE_BOTON_SECUNDARIO} flex-shrink-0`}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function FilaPersona({ persona, cuentasLibres }: { persona: PersonaFila; cuentasLibres: CuentaPanel[] }) {
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <li className="py-3">
        <PersonaForm persona={persona} cuentasLibres={cuentasLibres} onListo={() => setEditando(false)} />
      </li>
    )
  }

  const detalle = [
    persona.puesto,
    `Comisión ${persona.comision_pct.toLocaleString('es-AR')} %`,
    persona.cuenta_nombre ? `Cuenta: ${persona.cuenta_nombre}` : 'Sin cuenta en el panel',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="py-2.5 flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold break-words ${persona.activo ? 'text-brand-dark' : 'text-brand-muted'}`}>
            {persona.nombre}
          </span>
          {persona.activo ? null : (
            <span className="text-[10px] font-semibold px-1.5 rounded-full border border-brand-border text-brand-muted">
              Inactivo
            </span>
          )}
        </div>
        <div className="text-xs text-brand-muted break-words">{detalle}</div>
        {persona.telefono ? (
          <a href={`tel:${persona.telefono}`} className="text-xs text-brand-dark underline underline-offset-2">
            {persona.telefono}
          </a>
        ) : null}
      </div>
      <button type="button" onClick={() => setEditando(true)} className={`${CLASE_BOTON_SECUNDARIO} flex-shrink-0`}>
        Editar
      </button>
    </li>
  )
}

export default function PersonalPanel({
  personas,
  cuentasLibres,
}: {
  personas: PersonaFila[]
  cuentasLibres: CuentaPanel[]
}) {
  const [agregando, setAgregando] = useState(false)

  return (
    <Panel
      title={`Personal (${personas.length})`}
      action={
        agregando ? null : (
          <button type="button" onClick={() => setAgregando(true)} className={CLASE_BOTON_PILL}>
            + Agregar
          </button>
        )
      }
    >
      {agregando ? (
        <div className="mb-3">
          <PersonaForm cuentasLibres={cuentasLibres} onListo={() => setAgregando(false)} />
        </div>
      ) : null}
      {personas.length === 0 ? (
        agregando ? null : (
          <Empty>
            Todavía no hay nadie cargado. Empezá por quienes venden y por la gente del taller: no hace falta que
            tengan cuenta en el panel.
          </Empty>
        )
      ) : (
        <ul className="divide-y divide-brand-border/60">
          {personas.map((persona) => (
            <FilaPersona key={persona.id} persona={persona} cuentasLibres={cuentasLibres} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
