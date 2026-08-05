'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const INTERVAL_MS = 60_000

// El panel se mira desde el celular con la pestaña abierta media hora: sin esto
// habría que recargar a mano para ver una consulta nueva. Solo refresca con la
// pestaña visible, para no pegarle a la base con el teléfono en el bolsillo.
export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }, INTERVAL_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])

  return null
}
