'use client'

import { useState } from 'react'
import { normalizePhone } from '@/lib/adminFormat'

interface Props {
  phone: string | null
  nombre: string | null
  proyecto: string | null
}

// Barra fija al pie del panel derecho: lo único accionable del CRM es salir a
// hablar con la persona, no hay canal saliente propio.
export default function ConversationActions({ phone, nombre, proyecto }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!phone) {
      return
    }
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso de portapapeles queda el link tel: como alternativa.
    }
  }

  if (!phone) {
    return <p className="text-sm text-brand-muted text-center">No dejó teléfono en el chat.</p>
  }

  const waNumber = normalizePhone(phone)
  const waMessage = encodeURIComponent(
    `Hola${nombre ? ` ${nombre}` : ''}, soy Marcelo de MCP Muebles. Vi tu consulta${
      proyecto ? ` sobre ${proyecto}` : ' en la web'
    } y te escribo para avanzar.`
  )

  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/${waNumber}?text=${waMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center rounded-xl bg-brand-green text-white font-semibold py-3 text-sm"
      >
        WhatsApp
      </a>
      <a
        href={`tel:${waNumber}`}
        className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm font-semibold text-brand-dark"
      >
        Llamar
      </a>
      <button
        onClick={handleCopy}
        className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm font-semibold text-brand-dark"
      >
        {copied ? '¡Listo!' : 'Copiar'}
      </button>
    </div>
  )
}
