'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ConversationFilter } from '@/lib/crm'

// Buscar por nombre o teléfono es lo que se usa cuando viene una llamada
// perdida y hay que ubicar a esa persona; los chips de al lado cubren el resto.
export default function SearchBox({
  initialValue,
  filter,
}: {
  initialValue: string
  filter: ConversationFilter
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    const query = value.trim()
    if (query) {
      params.set('q', query)
    }
    if (filter !== 'todas') {
      params.set('f', filter)
    }
    const search = params.toString()
    router.push(search ? `/admin?${search}` : '/admin')
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nombre o teléfono…"
        className="flex-1 min-w-0 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-base focus:outline-none focus:border-brand-gold"
      />
      <button
        type="submit"
        className="rounded-xl bg-brand-dark text-brand-gold px-4 py-2.5 text-sm font-semibold flex-shrink-0"
      >
        Buscar
      </button>
    </form>
  )
}
