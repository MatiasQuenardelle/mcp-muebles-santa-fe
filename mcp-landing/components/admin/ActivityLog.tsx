'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteActivityRequest, postActivity } from '@/lib/adminApi'
import { STATUS_LABELS, formatDateTime, formatRelative } from '@/lib/adminFormat'
import {
  ACTIVITY_LABELS,
  MANUAL_ACTIVITY_KINDS,
  isConversationStatus,
  type ActivityKind,
} from '@/lib/crm'
import type { ActivityRow } from '@/lib/db'

const ICONS: Record<ActivityKind, string> = {
  nota: '✎',
  llamada: '☎',
  whatsapp: '✆',
  visita: '⌂',
  presupuesto: '$',
  estado: '→',
  alta: '+',
}

const PLACEHOLDERS: Record<string, string> = {
  nota: 'Qué hablaste, qué quedó pendiente…',
  llamada: 'Cómo salió la llamada (opcional)',
  whatsapp: 'Qué le escribiste (opcional)',
  visita: 'Medidas, detalles de la obra… (opcional)',
  presupuesto: 'Monto, línea, condiciones… (opcional)',
}

// Historial del contacto: lo que se fue haciendo, del más nuevo al más viejo.
// Registrar una llamada, visita o presupuesto también avanza el estado (ver
// addActivity en lib/db), así el embudo se mantiene solo.
export default function ActivityLog({ id, activities }: { id: string; activities: ActivityRow[] }) {
  const router = useRouter()
  const [kind, setKind] = useState<ActivityKind>('nota')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (kind === 'nota' && !text.trim()) {
      setError('Escribí la nota.')
      return
    }
    setIsSaving(true)
    setError('')
    const failure = await postActivity(id, kind, text.trim() || null)
    setIsSaving(false)
    if (failure) {
      setError(failure)
      return
    }
    setText('')
    setKind('nota')
    router.refresh()
  }

  async function handleDelete(activityId: number) {
    if (!window.confirm('¿Borrar esta entrada del historial?')) {
      return
    }
    const failure = await deleteActivityRequest(id, activityId)
    if (failure) {
      setError(failure)
      return
    }
    router.refresh()
  }

  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4">
      <h2 className="text-sm font-semibold text-brand-dark mb-3">Historial</h2>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {MANUAL_ACTIVITY_KINDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                option === kind
                  ? 'bg-brand-dark text-brand-gold border-brand-dark'
                  : 'bg-white text-brand-muted border-brand-border'
              }`}
            >
              {ICONS[option]} {ACTIVITY_LABELS[option]}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={PLACEHOLDERS[kind]}
          className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-gold resize-y"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-2 disabled:opacity-40"
          >
            {isSaving ? 'Guardando…' : `Registrar ${ACTIVITY_LABELS[kind].toLowerCase()}`}
          </button>
          {error ? <span className="text-xs text-red-700">{error}</span> : null}
        </div>
      </form>

      {activities.length === 0 ? (
        <p className="text-xs text-brand-muted mt-4">Todavía no hay nada registrado.</p>
      ) : (
        <ol className="mt-4 space-y-3 border-l border-brand-border ml-2.5">
          {activities.map((activity) => (
            <li key={activity.id} className="relative pl-5">
              <span
                aria-hidden
                className="absolute -left-[11px] top-0 w-[21px] h-[21px] rounded-full bg-brand-card border border-brand-border text-[11px] leading-[19px] text-center text-brand-dark"
              >
                {ICONS[activity.kind] ?? '•'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-brand-dark">
                  {ACTIVITY_LABELS[activity.kind] ?? activity.kind}
                </span>
                <span
                  className="text-[10px] text-brand-muted tabular-nums"
                  title={formatDateTime(activity.created_at)}
                >
                  {formatRelative(activity.created_at)}
                </span>
                {MANUAL_ACTIVITY_KINDS.includes(activity.kind) ? (
                  <button
                    onClick={() => handleDelete(activity.id)}
                    aria-label="Borrar entrada"
                    className="ml-auto text-[11px] text-brand-muted/70 hover:text-red-700 px-1"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
              {activity.body ? (
                <p className="text-sm text-brand-dark/85 mt-0.5 whitespace-pre-wrap break-words">
                  {activity.kind === 'estado' ? statusChangeLabel(activity.body) : activity.body}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// Se guarda como "contactado → visita" (las keys) para que no dependa de los
// textos de la interfaz; acá se traduce a las etiquetas.
function statusChangeLabel(body: string): string {
  return body
    .split(' → ')
    .map((part) => (isConversationStatus(part) ? STATUS_LABELS[part] : part))
    .join(' → ')
}
