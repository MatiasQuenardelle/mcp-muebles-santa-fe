'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { STATUS_LABELS, normalizePhone } from '@/lib/adminFormat'
import { CONVERSATION_STATUSES, type ConversationStatus } from '@/lib/crm'

interface Props {
  id: string
  status: ConversationStatus
  notes: string
  phone: string | null
  nombre: string | null
  proyecto: string | null
}

export default function ConversationActions({
  id,
  status: initialStatus,
  notes: initialNotes,
  phone,
  nombre,
  proyecto,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<ConversationStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes)
  const [savedNotes, setSavedNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  async function patch(payload: Record<string, unknown>) {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return response.ok
    } catch {
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatus(next: ConversationStatus) {
    const previous = status
    setStatus(next)
    if (!(await patch({ status: next }))) {
      setStatus(previous)
      return
    }
    router.refresh()
  }

  async function handleSaveNotes() {
    if (notes === savedNotes) {
      return
    }
    if (await patch({ notes })) {
      setSavedNotes(notes)
      router.refresh()
    }
  }

  async function handleCopy() {
    if (!phone) {
      return
    }
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso de portapapeles queda el link tel: como alternativa.
    }
  }

  const waNumber = phone ? normalizePhone(phone) : ''
  const waMessage = encodeURIComponent(
    `Hola${nombre ? ` ${nombre}` : ''}, soy Marcelo de MCP Muebles. Vi tu consulta${
      proyecto ? ` sobre ${proyecto}` : ' en la web'
    } y te escribo para avanzar.`
  )

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-4">
      {phone ? (
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${waNumber}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center rounded-xl bg-brand-green text-white font-semibold py-3 text-sm"
          >
            WhatsApp
          </a>
          <a
            href={`tel:${waNumber}`}
            className="rounded-xl border border-brand-border px-4 py-3 text-sm font-semibold text-brand-dark"
          >
            Llamar
          </a>
          <button
            onClick={handleCopy}
            className="rounded-xl border border-brand-border px-4 py-3 text-sm font-semibold text-brand-dark"
          >
            {copied ? '¡Listo!' : 'Copiar'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-brand-muted">No dejó teléfono en el chat.</p>
      )}

      <div>
        <div className="text-[11px] uppercase tracking-wide text-brand-muted mb-2">Estado</div>
        <div className="flex flex-wrap gap-1.5">
          {CONVERSATION_STATUSES.map((option) => (
            <button
              key={option}
              onClick={() => handleStatus(option)}
              disabled={isSaving}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                status === option
                  ? 'bg-brand-dark text-brand-gold border-brand-dark'
                  : 'bg-white text-brand-muted border-brand-border'
              }`}
            >
              {STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div>
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
          onBlur={handleSaveNotes}
          rows={3}
          placeholder="Qué hablaste, qué quedó pendiente…"
          className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold resize-y"
        />
        {notes !== savedNotes ? (
          <button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="mt-2 rounded-lg bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-2 disabled:opacity-40"
          >
            {isSaving ? 'Guardando…' : 'Guardar nota'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
