'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const FIELD =
  'w-full rounded-xl border border-brand-border px-4 py-3 text-base focus:outline-none focus:border-brand-gold'

// `next` ya viene validado desde el server component: siempre una ruta interna de /admin.
// Si la cuenta tiene verificación en dos pasos, el server responde needsCode y
// el mismo formulario pide el código de 6 dígitos.
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needsCode, setNeedsCode] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!email || !password || isLoading) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code: needsCode ? code : undefined }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        needsCode?: boolean
        ok?: boolean
      }

      if (data.needsCode) {
        setNeedsCode(true)
      }
      if (!response.ok) {
        setError(data.error ?? 'No se pudo ingresar.')
        return
      }
      if (data.ok) {
        router.replace(next)
        router.refresh()
      }
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-brand-border p-6 shadow-elevated space-y-4"
    >
      <label className="block">
        <span className="block text-sm font-semibold text-brand-dark mb-2">Email</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          // username + current-password: el llavero de iOS / el gestor de
          // contraseñas la guarda y la completa solo.
          autoComplete="username"
          autoFocus
          required
          value={email}
          readOnly={needsCode}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
        />
      </label>

      <label className={needsCode ? 'hidden' : 'block'}>
        <span className="block text-sm font-semibold text-brand-dark mb-2">Contraseña</span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD}
        />
      </label>

      {needsCode ? (
        <label className="block">
          <span className="block text-sm font-semibold text-brand-dark mb-1">
            Código de verificación
          </span>
          <span className="block text-xs text-brand-muted mb-2">
            Los 6 números que muestra tu app de autenticación.
          </span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${FIELD} tracking-[0.4em] text-center text-lg tabular-nums`}
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading || !email || !password || (needsCode && code.trim().length < 6)}
        className="w-full rounded-xl bg-brand-dark text-brand-gold font-semibold py-3 disabled:opacity-40 transition-opacity"
      >
        {isLoading ? 'Entrando…' : needsCode ? 'Verificar' : 'Entrar'}
      </button>

      <p className="text-xs text-brand-muted text-center">
        ¿Te olvidaste la contraseña? Pedile a quien administra el panel un link para restablecerla.
      </p>
    </form>
  )
}
