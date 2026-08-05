'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NotesBox({ id, notes: initialNotes }: { id: string; notes: string }) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [savedNotes, setSavedNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (notes === savedNotes) {
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (response.ok) {
        setSavedNotes(notes)
        router.refresh()
      }
    } catch {
      // Queda el botón "Guardar nota" visible para reintentar.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4">
      <label
        htmlFor="notes"
        className="block text-[11px] uppercase tracking-wide text-brand-muted mb-2"
      >
        Notas
      </label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleSave}
        rows={3}
        placeholder="Qué hablaste, qué quedó pendiente…"
        className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold resize-y"
      />
      {notes !== savedNotes ? (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-2 rounded-lg bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-2 disabled:opacity-40"
        >
          {isSaving ? 'Guardando…' : 'Guardar nota'}
        </button>
      ) : null}
    </section>
  )
}
