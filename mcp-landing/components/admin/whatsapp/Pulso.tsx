'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const INTERVAL_MS = 8_000

// Un chat de WhatsApp no puede esperar el minuto de AutoRefresh, y refrescar toda
// la página cada 8 s repetiría todas sus consultas. Se pregunta una huella liviana
// y solo si cambió se recarga. Con la pestaña oculta no consulta nada.
export default function Pulso({ conversationId }: { conversationId: string | null }) {
  const router = useRouter()
  const ultima = useRef<string | null>(null)

  useEffect(() => {
    ultima.current = null
    let activo = true

    async function consultar() {
      if (document.visibilityState !== 'visible') {
        return
      }
      try {
        const query = conversationId ? `?c=${conversationId}` : ''
        const response = await fetch(`/api/admin/whatsapp/pulso${query}`, { cache: 'no-store' })
        if (!response.ok || !activo) {
          return
        }
        const { huella } = (await response.json()) as { huella: string }
        if (ultima.current !== null && ultima.current !== huella) {
          router.refresh()
        }
        ultima.current = huella
      } catch {
        // Sin red se reintenta en la próxima vuelta.
      }
    }

    consultar()
    const interval = setInterval(consultar, INTERVAL_MS)
    document.addEventListener('visibilitychange', consultar)
    return () => {
      activo = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', consultar)
    }
  }, [conversationId, router])

  return null
}
