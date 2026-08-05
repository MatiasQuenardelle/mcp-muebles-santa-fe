'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Buscar por nombre o teléfono le sirve más a Marcelo que un set de filtros:
// casi siempre viene de una llamada perdida y busca a esa persona.
export default function SearchBox({ initialValue }: { initialValue: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const query = value.trim()
    router.push(query ? `/admin?q=${encodeURIComponent(query)}` : '/admin')
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
