'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// `next` ya viene validado desde el server component: siempre una ruta interna de /admin.
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!password || isLoading) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'No se pudo ingresar.')
        return
      }

      router.replace(next)
      router.refresh()
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-brand-border p-6 shadow-elevated"
    >
      <label htmlFor="password" className="block text-sm font-semibold text-brand-dark mb-2">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        // Para que el llavero de iOS la guarde y Marcelo no la tipee cada vez.
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-brand-border px-4 py-3 text-base focus:outline-none focus:border-brand-gold"
      />

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading || !password}
        className="mt-5 w-full rounded-xl bg-brand-dark text-brand-gold font-semibold py-3 disabled:opacity-40 transition-opacity"
      >
        {isLoading ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
