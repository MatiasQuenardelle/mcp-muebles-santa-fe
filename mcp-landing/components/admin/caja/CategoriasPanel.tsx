'use client'

import { useState } from 'react'
import {
  CLASE_BOTON,
  CLASE_BOTON_PILL,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Panel,
} from '@/components/admin/gestion/ui'
import type { GrupoCategoria } from '@/lib/gestion/calculos'
import type { CategoriaFila } from '@/lib/gestion/caja'
import { useEnvio } from './useEnvio'

const GRUPOS: { grupo: GrupoCategoria; titulo: string }[] = [
  { grupo: 'ingreso', titulo: 'Ingresos' },
  { grupo: 'negocio', titulo: 'Negocio' },
  { grupo: 'familia', titulo: 'Familia' },
]

function FormNueva({ onCerrar }: { onCerrar: () => void }) {
  const { enviando, error, enviar } = useEnvio()
  const [nombre, setNombre] = useState('')
  const [grupo, setGrupo] = useState<GrupoCategoria>('negocio')

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!enviando && (await enviar('POST', '/api/admin/caja/categorias', { nombre, grupo }))) {
      onCerrar()
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3 mb-3 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <Campo label="Grupo">
          <select
            value={grupo}
            onChange={(evento) => setGrupo(evento.target.value as GrupoCategoria)}
            className={CLASE_SELECT}
          >
            {GRUPOS.map((opcion) => (
              <option key={opcion.grupo} value={opcion.grupo}>
                {opcion.titulo}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <p className="text-xs text-brand-muted">
        El grupo no se puede cambiar después: define a qué ganancia suma, también en los meses pasados.
      </p>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <button type="submit" disabled={enviando} className={CLASE_BOTON}>
        {enviando ? 'Guardando…' : 'Crear categoría'}
      </button>
      <button type="button" onClick={onCerrar} className={CLASE_BOTON_SECUNDARIO}>
        Volver
      </button>
    </form>
  )
}

function FormRenombrar({ categoria, onCerrar }: { categoria: CategoriaFila; onCerrar: () => void }) {
  const { enviando, error, enviar } = useEnvio()
  const [nombre, setNombre] = useState(categoria.nombre)

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!enviando && (await enviar('PATCH', `/api/admin/caja/categorias/${categoria.id}`, { nombre }))) {
      onCerrar()
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-2">
      <input
        type="text"
        aria-label="Nuevo nombre"
        value={nombre}
        required
        maxLength={80}
        onChange={(evento) => setNombre(evento.target.value)}
        className={CLASE_INPUT}
      />
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <div className="flex gap-1.5">
        <button type="submit" disabled={enviando} className={CLASE_BOTON_PILL}>
          Guardar
        </button>
        <button type="button" onClick={onCerrar} className={CLASE_BOTON_SECUNDARIO}>
          Volver
        </button>
      </div>
    </form>
  )
}

export default function CategoriasPanel({ categorias }: { categorias: CategoriaFila[] }) {
  const { enviando, error, enviar } = useEnvio()
  const [creando, setCreando] = useState(false)
  const [renombrando, setRenombrando] = useState<string | null>(null)

  async function cambiarActiva(categoria: CategoriaFila) {
    if (categoria.activa && !window.confirm(`¿Dar de baja "${categoria.nombre}"? Deja de aparecer al cargar movimientos.`)) {
      return
    }
    await enviar('PATCH', `/api/admin/caja/categorias/${categoria.id}`, { activa: !categoria.activa })
  }

  return (
    <Panel
      title="Categorías"
      action={
        creando ? null : (
          <button type="button" onClick={() => setCreando(true)} className={CLASE_BOTON_PILL}>
            + Nueva categoría
          </button>
        )
      }
    >
      {creando ? <FormNueva onCerrar={() => setCreando(false)} /> : null}
      {error ? <p className={`${CLASE_ERROR} mb-2`}>{error}</p> : null}

      <div className="space-y-4">
        {GRUPOS.map(({ grupo, titulo }) => (
          <div key={grupo}>
            <h3 className="text-[11px] uppercase tracking-wide text-brand-muted">{titulo}</h3>
            <ul className="divide-y divide-brand-border/60">
              {categorias
                .filter((categoria) => categoria.grupo === grupo)
                .map((categoria) => (
                  <li key={categoria.id} className="py-2">
                    {renombrando === categoria.id ? (
                      <FormRenombrar categoria={categoria} onCerrar={() => setRenombrando(null)} />
                    ) : (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-sm min-w-0 break-words ${
                            categoria.activa ? 'text-brand-dark' : 'text-brand-muted line-through'
                          }`}
                        >
                          {categoria.nombre}
                        </span>
                        {categoria.clave !== null ? (
                          <span className="text-[11px] text-brand-muted">Del sistema</span>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRenombrando(categoria.id)}
                              className={CLASE_BOTON_SECUNDARIO}
                            >
                              Renombrar
                            </button>
                            <button
                              type="button"
                              disabled={enviando}
                              onClick={() => cambiarActiva(categoria)}
                              className={CLASE_BOTON_SECUNDARIO}
                            >
                              {categoria.activa ? 'Dar de baja' : 'Reactivar'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  )
}
