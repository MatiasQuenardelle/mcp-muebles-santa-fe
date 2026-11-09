'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { send } from '@/lib/adminApi'

// Lo que repiten todos los formularios de este módulo: mandar, mostrar el error y
// volver a leer la pantalla si salió bien.
export function useEnvio() {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar(metodo: 'POST' | 'PATCH' | 'DELETE', url: string, cuerpo?: unknown): Promise<boolean> {
    setEnviando(true)
    setError(null)
    const problema = await send(metodo, url, cuerpo)
    setEnviando(false)
    if (problema) {
      setError(problema)
      return false
    }
    router.refresh()
    return true
  }

  return { enviando, error, setError, enviar }
}
