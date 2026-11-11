'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { send } from '@/lib/adminApi'

interface Props {
  conversationId: string
  ventanaAbierta: boolean
}

export default function Composer({ conversationId, ventanaAbierta }: Props) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [sugiriendo, setSugiriendo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sugerir() {
    setSugiriendo(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/whatsapp/sugerir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
      const data = (await response.json().catch(() => ({}))) as { suggestion?: string; error?: string }
      if (data.suggestion) {
        setTexto(data.suggestion)
      } else {
        setError(data.error ?? 'No se pudo generar la sugerencia.')
      }
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
    }
    setSugiriendo(false)
  }

  async function enviar() {
    setEnviando(true)
    setError(null)
    const fallo = await send('POST', '/api/admin/whatsapp/enviar', { conversationId, text: texto })
    setEnviando(false)
    if (fallo) {
      setError(fallo)
      return
    }
    setTexto('')
    router.refresh()
  }

  if (!ventanaAbierta) {
    return (
      <p className="text-xs text-brand-muted text-center mb-2">
        Pasaron más de 24 horas desde el último mensaje del cliente. WhatsApp solo deja escribirle desde
        acá si él vuelve a escribir, o abriendo la app.
      </p>
    )
  }

  const ocupado = sugiriendo || enviando
  return (
    <div>
      {error ? <p className="text-xs text-red-700 mb-2">{error}</p> : null}
      {/* text-base: con menos de 16px, Safari en iPhone hace zoom al enfocar. */}
      <textarea
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        rows={texto.length > 70 ? 5 : 2}
        maxLength={4000}
        placeholder="Escribí un mensaje"
        aria-label="Mensaje para el cliente"
        className="w-full resize-none rounded-xl border border-brand-border bg-white px-3 py-2 text-base text-brand-dark outline-none focus:border-brand-gold"
      />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={sugerir}
          disabled={ocupado}
          className="flex-1 min-h-11 rounded-xl border border-brand-border bg-white text-sm font-semibold text-brand-dark disabled:opacity-60"
        >
          {sugiriendo ? 'Pensando…' : 'Sugerir respuesta'}
        </button>
        <button
          type="button"
          onClick={enviar}
          disabled={ocupado || !texto.trim()}
          className="flex-1 min-h-11 rounded-xl bg-brand-green text-sm font-semibold text-white disabled:opacity-60"
        >
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
