'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { patchConversation } from '@/lib/adminApi'
import { FOLLOW_UP_STYLES, addDaysKey, followUpLabel } from '@/lib/adminFormat'

const SHORTCUTS = [
  { label: 'Hoy', days: 0 },
  { label: 'Mañana', days: 1 },
  { label: 'En 3 días', days: 3 },
  { label: 'En 1 semana', days: 7 },
  { label: 'En 2 semanas', days: 14 },
]

// Próximo contacto. Es lo que alimenta la agenda de Inicio y el filtro
// "Seguimiento hoy": un contacto sin fecha no aparece en ningún recordatorio.
export default function FollowUpBox({
  id,
  date,
  note,
  closed,
}: {
  id: string
  date: string | null
  note: string | null
  closed: boolean
}) {
  const router = useRouter()
  const [draftNote, setDraftNote] = useState(note ?? '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function save(fields: Record<string, unknown>) {
    setIsSaving(true)
    setError('')
    const failure = await patchConversation(id, fields)
    setIsSaving(false)
    if (failure) {
      setError(failure)
      return
    }
    router.refresh()
  }

  const current = date ? followUpLabel(date) : null

  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-brand-dark flex-1">Próximo seguimiento</h2>
        {current ? (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${FOLLOW_UP_STYLES[current.tone]}`}
          >
            {current.label}
          </span>
        ) : (
          <span className="text-[11px] text-brand-muted">
            {closed ? 'cerrado, sin seguimiento' : 'sin fecha'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SHORTCUTS.map((shortcut) => {
          const value = addDaysKey(shortcut.days)
          return (
            <button
              key={shortcut.label}
              disabled={isSaving}
              onClick={() => save({ follow_up_on: value, follow_up_note: draftNote })}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                value === date
                  ? 'bg-brand-dark text-brand-gold border-brand-dark'
                  : 'bg-white text-brand-muted border-brand-border'
              }`}
            >
              {shortcut.label}
            </button>
          )
        })}
        <input
          type="date"
          aria-label="Elegir fecha"
          value={date ?? ''}
          disabled={isSaving}
          onChange={(e) => save({ follow_up_on: e.target.value || null, follow_up_note: draftNote })}
          className="text-xs px-2 py-1 rounded-full border border-brand-border bg-white text-brand-dark"
        />
        {date ? (
          <button
            disabled={isSaving}
            onClick={() => save({ follow_up_on: null, follow_up_note: null }).then(() => setDraftNote(''))}
            className="text-xs font-semibold px-3 py-1.5 text-red-700 disabled:opacity-50"
          >
            Quitar
          </button>
        ) : null}
      </div>

      {date ? (
        <input
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          onBlur={() => {
            if (draftNote !== (note ?? '')) {
              save({ follow_up_note: draftNote })
            }
          }}
          placeholder="Qué hay que hacer: mandar presupuesto, confirmar medidas…"
          className="mt-3 w-full rounded-xl border border-brand-border px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-gold"
        />
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  )
}
