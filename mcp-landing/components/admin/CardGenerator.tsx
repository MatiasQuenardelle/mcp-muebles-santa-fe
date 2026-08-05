'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Las tarjetas no se generan en el server component: el timeout de una función
// de Vercel en Hobby es de 10s y varias tarjetas seguidas lo revientan, además
// de bloquear el primer render. Se generan de a tandas desde el cliente y
// recién al final se refresca la lista.
const MAX_ROUNDS = 10

export default function CardGenerator() {
  const router = useRouter()
  const [pending, setPending] = useState(0)
  const hasRunRef = useRef(false)

  useEffect(() => {
    // En dev, StrictMode monta dos veces; el lock de la base evitaría duplicar
    // el trabajo igual, pero mejor no gastar el request.
    if (hasRunRef.current) {
      return
    }
    hasRunRef.current = true

    let cancelled = false

    async function run() {
      let generated = 0

      for (let round = 0; round < MAX_ROUNDS && !cancelled; round += 1) {
        let data: { generated?: number; remaining?: number }
        try {
          const response = await fetch('/api/admin/cards/tick', { method: 'POST' })
          if (!response.ok) {
            break
          }
          data = (await response.json()) as { generated?: number; remaining?: number }
        } catch {
          break
        }

        generated += data.generated ?? 0
        if (!cancelled) {
          setPending(data.remaining ?? 0)
        }

        if (!data.remaining || !data.generated) {
          break
        }
      }

      if (generated > 0 && !cancelled) {
        setPending(0)
        router.refresh()
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [router])

  if (pending === 0) {
    return null
  }

  return (
    <p className="mt-3 text-xs text-brand-muted flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
      Preparando {pending} resumen{pending === 1 ? '' : 'es'}…
    </p>
  )
}
