'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { send } from '@/lib/adminApi'
import type { ModoBot } from '@/lib/whatsapp/modo'
import SelectorModo from './SelectorModo'

const EXPLICACION: Record<ModoBot, string> = {
  OFF: 'El bot no contesta y el workflow queda desactivado en Kapso.',
  SUGGEST: 'El bot no contesta. Desde cada chat se puede pedir una sugerencia y enviarla.',
  AUTO: 'El bot contesta solo, salvo en los chats donde intervino una persona.',
}

export default function BotGeneral({ mode, conectado }: { mode: ModoBot; conectado: boolean }) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiar(nuevo: ModoBot) {
    if (nuevo === mode) {
      return
    }
    setOcupado(true)
    setError(null)
    const fallo = await send('PATCH', '/api/admin/whatsapp/modo', { mode: nuevo })
    setOcupado(false)
    if (fallo) {
      setError(fallo)
      return
    }
    router.refresh()
  }

  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4 mb-6">
      <h2 className="text-sm font-semibold text-brand-dark">Bot de WhatsApp</h2>
      <p className="text-xs text-brand-muted mt-0.5 mb-3">
        {conectado ? 'Número conectado.' : 'El número todavía no está conectado a Kapso.'}
      </p>
      <SelectorModo value={mode} disabled={ocupado || !conectado} onChange={cambiar} />
      <p className="text-xs text-brand-muted mt-2">{EXPLICACION[mode]}</p>
      {error ? <p className="text-xs text-red-700 mt-2">{error}</p> : null}
    </section>
  )
}
