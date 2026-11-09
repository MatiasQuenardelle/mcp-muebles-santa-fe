'use client'

import { useState } from 'react'
import {
  CLASE_BOTON,
  CLASE_BOTON_PILL,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
  CLASE_INPUT,
  Campo,
  Empty,
  Panel,
} from '@/components/admin/gestion/ui'
import type { NotaFila } from '@/lib/gestion/caja'
import { useEnvio } from './useEnvio'

function FormNota({ nota, onCerrar }: { nota: NotaFila | null; onCerrar: () => void }) {
  const { enviando, error, enviar } = useEnvio()
  const [titulo, setTitulo] = useState(nota?.titulo ?? '')
  const [contenido, setContenido] = useState(nota?.contenido ?? '')

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) {
      return
    }
    const cuerpo = { titulo, contenido }
    const listo = nota
      ? await enviar('PATCH', `/api/admin/empresa/notas/${nota.id}`, cuerpo)
      : await enviar('POST', '/api/admin/empresa/notas', cuerpo)
    if (listo) {
      onCerrar()
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <Campo label="Título">
        <input
          type="text"
          value={titulo}
          required
          maxLength={120}
          onChange={(evento) => setTitulo(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <Campo label="Contenido">
        <textarea
          value={contenido}
          required
          rows={5}
          maxLength={5000}
          onChange={(evento) => setContenido(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <button type="submit" disabled={enviando} className={CLASE_BOTON}>
        {enviando ? 'Guardando…' : 'Guardar nota'}
      </button>
      <button type="button" onClick={onCerrar} className={CLASE_BOTON_SECUNDARIO}>
        Volver
      </button>
    </form>
  )
}

export default function NotasPanel({ notas }: { notas: NotaFila[] }) {
  const { enviando, error, enviar } = useEnvio()
  const [editando, setEditando] = useState<string | null>(null)

  async function borrar(nota: NotaFila) {
    if (window.confirm(`¿Borrar "${nota.titulo}"? No se puede deshacer.`)) {
      await enviar('DELETE', `/api/admin/empresa/notas/${nota.id}`)
    }
  }

  return (
    <Panel
      title="Datos de la empresa"
      action={
        editando === 'nueva' ? null : (
          <button type="button" onClick={() => setEditando('nueva')} className={CLASE_BOTON_PILL}>
            + Nueva nota
          </button>
        )
      }
    >
      {editando === 'nueva' ? (
        <div className="mb-3">
          <FormNota nota={null} onCerrar={() => setEditando(null)} />
        </div>
      ) : null}

      {error ? <p className={`${CLASE_ERROR} mb-2`}>{error}</p> : null}

      {notas.length === 0 ? (
        <Empty>Todavía no hay notas. Empezá por el CUIT, los seguros o los contactos útiles.</Empty>
      ) : (
        <ul className="divide-y divide-brand-border/60">
          {notas.map((nota) => (
            <li key={nota.id} className="py-3">
              {editando === nota.id ? (
                <FormNota nota={nota} onCerrar={() => setEditando(null)} />
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-brand-dark break-words">{nota.titulo}</h3>
                  <p className="mt-1 text-sm text-brand-dark whitespace-pre-wrap break-words">{nota.contenido}</p>
                  <p className="mt-1 text-[11px] text-brand-muted">
                    Actualizada {nota.actualizada}
                    {nota.actualizado_por_nombre ? ` · ${nota.actualizado_por_nombre}` : ''}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    <button type="button" onClick={() => setEditando(nota.id)} className={CLASE_BOTON_SECUNDARIO}>
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => borrar(nota)}
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
