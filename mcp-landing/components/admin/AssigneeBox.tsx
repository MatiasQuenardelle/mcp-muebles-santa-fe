'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { patchConversation } from '@/lib/adminApi'

// Responsable del contacto. El dueño elige de la lista del equipo; un usuario
// común solo puede tomar uno sin asignar o soltar uno suyo (el server lo
// vuelve a chequear). Soltarlo lo devuelve al pozo, visible para todos.
export default function AssigneeBox({
  id,
  assignedTo,
  assignedName,
  viewerId,
  team,
}: {
  id: string
  assignedTo: string | null
  assignedName: string | null
  viewerId: string
  // Solo viene para el dueño.
  team: Array<{ id: string; name: string }> | null
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function assign(assignee: string | null) {
    setIsSaving(true)
    setError('')
    const failure = await patchConversation(id, { assignedTo: assignee })
    setIsSaving(false)
    if (failure) {
      setError(failure)
      return
    }
    router.refresh()
  }

  const isMine = assignedTo === viewerId

  return (
    <section className="bg-white rounded-2xl border border-brand-border px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-brand-dark flex-1">Responsable</h2>

        {team ? (
          <select
            aria-label="Responsable"
            value={assignedTo ?? ''}
            disabled={isSaving}
            onChange={(e) => assign(e.target.value || null)}
            className="text-sm rounded-full border border-brand-border bg-white px-3 py-1.5 text-brand-dark disabled:opacity-50"
          >
            <option value="">Sin asignar</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.id === viewerId ? `${member.name} (vos)` : member.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <span className="text-sm text-brand-muted">
              {assignedTo ? (isMine ? 'Vos' : assignedName) : 'Sin asignar'}
            </span>
            {assignedTo === null || isMine ? (
              <button
                disabled={isSaving}
                onClick={() => assign(isMine ? null : viewerId)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border disabled:opacity-50 ${
                  isMine
                    ? 'bg-white text-brand-muted border-brand-border'
                    : 'bg-brand-dark text-brand-gold border-brand-dark'
                }`}
              >
                {isMine ? 'Soltar' : 'Tomarlo'}
              </button>
            ) : null}
          </>
        )}
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  )
}
