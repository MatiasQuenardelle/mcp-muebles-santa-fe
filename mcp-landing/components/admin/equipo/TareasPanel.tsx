'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CLASE_BOTON,
  CLASE_BOTON_PILL,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
  CLASE_ERROR,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Empty,
  Panel,
} from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import { FOLLOW_UP_STYLES, followUpLabel } from '@/lib/adminFormat'
import type { OpcionesTarea, TareaFila } from '@/lib/gestion/equipo'

function hrefTareas(persona: string, hechas: boolean): string {
  const parametros = new URLSearchParams()
  if (persona) {
    parametros.set('persona', persona)
  }
  if (hechas) {
    parametros.set('hechas', '1')
  }
  const consulta = parametros.toString()
  return consulta ? `/admin/equipo/tareas?${consulta}` : '/admin/equipo/tareas'
}

function agrupar(tareas: TareaFila[], hoy: string) {
  const abiertas = tareas.filter((tarea) => tarea.hecha_el === null)
  return [
    { titulo: 'Vencidas', items: abiertas.filter((tarea) => tarea.vence_el !== null && tarea.vence_el < hoy) },
    { titulo: 'Hoy', items: abiertas.filter((tarea) => tarea.vence_el === hoy) },
    { titulo: 'Próximas', items: abiertas.filter((tarea) => tarea.vence_el !== null && tarea.vence_el > hoy) },
    { titulo: 'Sin fecha', items: abiertas.filter((tarea) => tarea.vence_el === null) },
    { titulo: 'Hechas', items: tareas.filter((tarea) => tarea.hecha_el !== null) },
  ].filter((grupo) => grupo.items.length > 0)
}

function fechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`
}

function TareaForm({
  tarea,
  opciones,
  onListo,
}: {
  tarea?: TareaFila
  opciones: OpcionesTarea
  onListo: () => void
}) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(tarea?.titulo ?? '')
  const [detalle, setDetalle] = useState(tarea?.detalle ?? '')
  const [personalId, setPersonalId] = useState(tarea?.personal_id ?? '')
  const [obraId, setObraId] = useState(tarea?.obra_id ?? '')
  const [venceEl, setVenceEl] = useState(tarea?.vence_el ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados de baja y obras cerradas no se ofrecen, salvo que la tarea ya los tenga:
  // editar el título no puede borrarle la persona o la obra.
  const personas = opciones.personal.filter((persona) => persona.activo || persona.id === tarea?.personal_id)
  const obras =
    tarea?.obra_id && !opciones.obras.some((obra) => obra.id === tarea.obra_id)
      ? [{ id: tarea.obra_id, numero: tarea.obra_numero ?? '', titulo: tarea.obra_titulo ?? '' }, ...opciones.obras]
      : opciones.obras

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    setGuardando(true)
    setError(null)
    const cuerpo = {
      titulo,
      detalle,
      personalId: personalId || null,
      obraId: obraId || null,
      venceEl: venceEl || null,
    }
    const problema = tarea
      ? await send('PATCH', `/api/admin/equipo/tareas/${tarea.id}`, cuerpo)
      : await send('POST', '/api/admin/equipo/tareas', cuerpo)
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
      <Campo label="Título">
        <input
          type="text"
          value={titulo}
          required
          maxLength={200}
          onChange={(evento) => setTitulo(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <Campo label="Detalle (opcional)">
        <textarea
          value={detalle}
          rows={2}
          maxLength={2000}
          onChange={(evento) => setDetalle(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <Campo label="Persona">
        <select value={personalId} onChange={(evento) => setPersonalId(evento.target.value)} className={CLASE_SELECT}>
          <option value="">Sin asignar (solo la ven los dueños)</option>
          {personas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.nombre}
            </option>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Campo label="Obra (opcional)">
          <select value={obraId} onChange={(evento) => setObraId(evento.target.value)} className={CLASE_SELECT}>
            <option value="">Ninguna</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.numero} · {obra.titulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Vence el (opcional)">
          <input
            type="date"
            value={venceEl}
            onChange={(evento) => setVenceEl(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={guardando} className={CLASE_BOTON}>
          {guardando ? 'Guardando…' : tarea ? 'Guardar cambios' : 'Crear tarea'}
        </button>
        <button type="button" onClick={onListo} className={`${CLASE_BOTON_SECUNDARIO} flex-shrink-0`}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function FilaTarea({ tarea, opciones }: { tarea: TareaFila; opciones: OpcionesTarea | null }) {
  const router = useRouter()
  const [hecha, setHecha] = useState(tarea.hecha_el !== null)
  const [marcando, setMarcando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function alternar() {
    if (marcando) {
      return
    }
    const nuevo = !hecha
    // Se ve al instante; si la base dice que no, vuelve atrás y lo avisa.
    setHecha(nuevo)
    setMarcando(true)
    setError(null)
    const problema = await send('PATCH', `/api/admin/equipo/tareas/${tarea.id}/hecha`, { hecha: nuevo })
    setMarcando(false)
    if (problema) {
      setHecha(!nuevo)
      setError(problema)
      return
    }
    router.refresh()
  }

  async function borrar() {
    setBorrando(true)
    setError(null)
    const problema = await send('DELETE', `/api/admin/equipo/tareas/${tarea.id}`)
    setBorrando(false)
    if (problema) {
      setError(problema)
      return
    }
    router.refresh()
  }

  if (editando && opciones) {
    return (
      <li className="py-3">
        <TareaForm tarea={tarea} opciones={opciones} onListo={() => setEditando(false)} />
      </li>
    )
  }

  const vencimiento = tarea.vence_el && !hecha ? followUpLabel(tarea.vence_el) : null

  return (
    <li className="py-1.5">
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={alternar}
          aria-pressed={hecha}
          aria-label={hecha ? `Marcar "${tarea.titulo}" como pendiente` : `Marcar "${tarea.titulo}" como hecha`}
          className="flex-shrink-0 w-11 h-11 -ml-2 flex items-center justify-center"
        >
          <span
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              hecha ? 'bg-brand-dark border-brand-dark text-brand-gold' : 'bg-white border-brand-muted-dark'
            }`}
          >
            {hecha ? (
              <svg
                viewBox="0 0 20 20"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
            ) : null}
          </span>
        </button>
        <div className="min-w-0 flex-1 pt-2">
          <div className={`text-sm break-words ${hecha ? 'text-brand-muted line-through' : 'text-brand-dark font-medium'}`}>
            {tarea.titulo}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-muted">
            {vencimiento ? (
              <span
                className={`text-[10px] font-semibold px-1.5 rounded-full border flex-shrink-0 ${FOLLOW_UP_STYLES[vencimiento.tone]}`}
              >
                {vencimiento.label}
              </span>
            ) : null}
            {tarea.hecha_el ? <span>Hecha el {fechaCorta(tarea.hecha_el)}</span> : null}
            {opciones ? <span className="break-words min-w-0">{tarea.personal_nombre ?? 'Sin asignar'}</span> : null}
            {tarea.obra_numero ? (
              <span className="break-words min-w-0">
                {tarea.obra_numero} · {tarea.obra_titulo}
              </span>
            ) : null}
          </div>
          {tarea.detalle ? (
            <p className="mt-1 text-xs text-brand-muted whitespace-pre-line break-words">{tarea.detalle}</p>
          ) : null}
          {error ? <p className={`${CLASE_ERROR} mt-1`}>{error}</p> : null}
          {opciones ? (
            confirmandoBorrado ? (
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-brand-dark">¿Borrar esta tarea?</span>
                <button
                  type="button"
                  disabled={borrando}
                  onClick={borrar}
                  className="rounded-full bg-red-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
                >
                  Sí, borrar
                </button>
                <button type="button" onClick={() => setConfirmandoBorrado(false)} className={CLASE_BOTON_SECUNDARIO}>
                  Volver
                </button>
              </div>
            ) : (
              <div className="mt-0.5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="text-[11px] text-brand-muted underline underline-offset-2 py-1"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoBorrado(true)}
                  className="text-[11px] text-brand-muted underline underline-offset-2 py-1"
                >
                  Borrar
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>
    </li>
  )
}

export default function TareasPanel({
  tareas,
  hoy,
  opciones,
  filtroPersona,
  verHechas,
}: {
  tareas: TareaFila[]
  hoy: string
  // Solo les llega a los dueños: sin esto no hay filtros de persona, ni alta, ni edición.
  opciones: OpcionesTarea | null
  filtroPersona: string
  verHechas: boolean
}) {
  const router = useRouter()
  const [creando, setCreando] = useState(false)
  const grupos = agrupar(tareas, hoy)
  const sinPersonas = opciones !== null && opciones.personal.length === 0

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {opciones ? (
          <select
            aria-label="Filtrar por persona"
            value={filtroPersona}
            onChange={(evento) => router.push(hrefTareas(evento.target.value, verHechas))}
            className={`${CLASE_SELECT} sm:w-64`}
          >
            <option value="">Todas las personas</option>
            <option value="sin">Sin asignar</option>
            {opciones.personal.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.nombre}
              </option>
            ))}
          </select>
        ) : null}
        <Link
          href={hrefTareas(filtroPersona, !verHechas)}
          className={`rounded-full border text-xs font-semibold px-3 py-1.5 ${
            verHechas ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
          }`}
        >
          {verHechas ? 'Ocultar hechas' : 'Ver hechas'}
        </Link>
        {opciones && !creando ? (
          <button type="button" onClick={() => setCreando(true)} className={`${CLASE_BOTON_PILL} ml-auto`}>
            + Nueva tarea
          </button>
        ) : null}
      </div>

      {creando && opciones ? (
        <div className="max-w-2xl">
          <Panel title="Nueva tarea">
            <TareaForm opciones={opciones} onListo={() => setCreando(false)} />
          </Panel>
        </div>
      ) : null}

      {grupos.length === 0 ? (
        <Panel title="Tareas">
          {sinPersonas ? (
            <Empty>
              Para repartir tareas primero cargá a las personas del equipo en{' '}
              <Link href="/admin/equipo" className="underline underline-offset-2">
                Equipo
              </Link>
              .
            </Empty>
          ) : (
            <Empty>
              {opciones === null
                ? 'No tenés tareas pendientes.'
                : filtroPersona
                  ? 'No hay tareas pendientes con este filtro.'
                  : 'No hay tareas pendientes. Cargá la primera con + Nueva tarea.'}
            </Empty>
          )}
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {grupos.map((grupo) => (
            <Panel key={grupo.titulo} title={`${grupo.titulo} (${grupo.items.length})`}>
              <ul className="divide-y divide-brand-border/60">
                {grupo.items.map((tarea) => (
                  <FilaTarea key={tarea.id} tarea={tarea} opciones={opciones} />
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
