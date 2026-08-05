'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

// No renderiza nada: solo avisa que la conversación se abrió. Va del lado del
// cliente porque un server component no puede escribir durante el render.
// Montarlo con key={id} hace que se dispare de nuevo al cambiar de conversación.
export default function MarkRead({ id, unread }: { id: string; unread: boolean }) {
  const router = useRouter()
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (!unread || hasRunRef.current) {
      return
    }
    hasRunRef.current = true

    let cancelled = false
    fetch(`/api/admin/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
      .then((response) => {
        if (response.ok && !cancelled) {
          // Para que desaparezca el punto de no leída en la lista de al lado.
          router.refresh()
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [id, unread, router])

  return null
}
