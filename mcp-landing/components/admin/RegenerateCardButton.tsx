'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Rehace la tarjeta a pedido: sirve cuando la charla siguió después de generarla
// o cuando el resumen salió pobre.
export default function RegenerateCardButton({ id, hasCard }: { id: string; hasCard: boolean }) {
  const router = useRouter()
  const [isWorking, setIsWorking] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleClick() {
    setIsWorking(true)
    setFailed(false)
    try {
      const response = await fetch(`/api/admin/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateCard: true }),
      })
      if (!response.ok) {
        setFailed(true)
        return
      }
      router.refresh()
    } catch {
      setFailed(true)
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {failed ? <span className="text-[11px] text-red-600">No salió</span> : null}
      <button
        onClick={handleClick}
        disabled={isWorking}
        className="text-[11px] font-semibold text-brand-muted border border-brand-border rounded-full px-3 py-1 disabled:opacity-40"
      >
        {isWorking ? 'Generando…' : hasCard ? 'Regenerar' : 'Generar ahora'}
      </button>
    </div>
  )
}
