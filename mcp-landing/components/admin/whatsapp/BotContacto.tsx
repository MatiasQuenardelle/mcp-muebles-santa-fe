'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { send } from '@/lib/adminApi'
import { ETIQUETAS_MODO, modoEfectivo, type ModoBot } from '@/lib/whatsapp/modo'
import SelectorModo from './SelectorModo'

interface Props {
  conversationId: string
  general: ModoBot
  override: ModoBot | null
}

export default function BotContacto({ conversationId, general, override }: Props) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const efectivo = modoEfectivo(general, override)

  async function cambiar(mode: ModoBot | null) {
    setOcupado(true)
    setError(null)
    const fallo = await send('PATCH', '/api/admin/whatsapp/modo', { conversationId, mode })
    setOcupado(false)
    if (fallo) {
      setError(fallo)
      return
    }
    router.refresh()
  }

  return (
    <details className="group bg-white rounded-2xl border border-brand-border">
      <summary className="flex items-center gap-2 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <h2 className="text-sm font-semibold text-brand-dark">Bot en este chat</h2>
        <span className="text-[11px] text-brand-muted flex-1 truncate">
          {ETIQUETAS_MODO[efectivo]}
          {override ? ' · solo este chat' : ''}
        </span>
        {general === 'AUTO' && efectivo !== 'AUTO' ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={(event) => {
              // Está dentro del summary: sin esto, además abriría el panel.
              event.preventDefault()
              cambiar(null)
            }}
            className="text-xs font-semibold text-brand-dark border border-brand-border rounded-full px-3 py-1 disabled:opacity-60"
          >
            Reactivar
          </button>
        ) : null}
        <span aria-hidden className="text-brand-muted text-xs transition-transform group-open:rotate-180">
          ▼
        </span>
      </summary>
      <div className="px-4 pb-4">
        <SelectorModo value={efectivo} disabled={ocupado} onChange={cambiar} />
        {override ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => cambiar(null)}
            className="text-xs text-brand-muted underline mt-2 disabled:opacity-60"
          >
            Usar el modo general ({ETIQUETAS_MODO[general]})
          </button>
        ) : null}
        {error ? <p className="text-xs text-red-700 mt-2">{error}</p> : null}
      </div>
    </details>
  )
}
