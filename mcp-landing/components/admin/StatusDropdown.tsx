'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { STATUS_DOTS, STATUS_LABELS } from '@/lib/adminFormat'
import { CONVERSATION_STATUSES, type ConversationStatus } from '@/lib/crm'

// Un <select> nativo y no un menú propio: en el iPhone abre la rueda del sistema
// y no hay que manejar clicks afuera ni foco.
export default function StatusDropdown({
  id,
  status: initialStatus,
}: {
  id: string
  status: ConversationStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<ConversationStatus>(initialStatus)
  const [isSaving, setIsSaving] = useState(false)

  async function handleChange(next: ConversationStatus) {
    const previous = status
    setStatus(next)
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!response.ok) {
        setStatus(previous)
        return
      }
      router.refresh()
    } catch {
      setStatus(previous)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white pl-2.5 pr-6 py-1">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOTS[status]}`} />
      <select
        aria-label="Estado"
        value={status}
        disabled={isSaving}
        onChange={(e) => handleChange(e.target.value as ConversationStatus)}
        className="appearance-none bg-transparent text-xs font-semibold text-brand-dark focus:outline-none disabled:opacity-50"
      >
        {CONVERSATION_STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2 text-[9px] text-brand-muted">
        ▼
      </span>
    </div>
  )
}
