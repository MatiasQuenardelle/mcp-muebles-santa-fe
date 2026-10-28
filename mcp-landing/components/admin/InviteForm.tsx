'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const FIELD =
  'w-full rounded-xl border border-brand-border px-4 py-3 text-base focus:outline-none focus:border-brand-gold'

type State =
  | { step: 'loading' }
  | { step: 'invalid'; message: string }
  | { step: 'form'; name: string; email: string; isReset: boolean }

// El token llega en el fragmento de la URL (/admin/invitacion#<token>): no pasa
// por el server ni queda en los logs. Se lee acá y se postea a /api/admin/invite.
export default function InviteForm() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [state, setState] = useState<State>({ step: 'loading' })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const value = window.location.hash.slice(1)
    // Se saca del historial y de la barra: si alguien mira la pantalla o el
    // historial del navegador, el link ya no está.
    window.history.replaceState(null, '', window.location.pathname)
    if (!value) {
      setState({ step: 'invalid', message: 'El link está incompleto. Abrilo de nuevo desde el mensaje.' })
      return
    }
    setToken(value)
    fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: value }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          name?: string
          email?: string
          isReset?: boolean
          error?: string
        }
        if (!response.ok || !data.email) {
          setState({ step: 'invalid', message: data.error ?? 'Este link no es válido.' })
          return
        }
        setState({ step: 'form', name: data.name ?? '', email: data.email, isReset: Boolean(data.isReset) })
      })
      .catch(() => setState({ step: 'invalid', message: 'No se pudo conectar. Recargá la página.' }))
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password !== confirm) {
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'No se pudo guardar.')
        return
      }
      router.replace('/admin/inicio')
      router.refresh()
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  if (state.step === 'loading') {
    return <p className="text-sm text-brand-muted text-center">Verificando el link…</p>
  }
  if (state.step === 'invalid') {
    return (
      <div className="bg-white rounded-2xl border border-brand-border p-6 text-center">
        <p className="text-sm text-brand-dark">{state.message}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-brand-border p-6 shadow-elevated space-y-4"
    >
      <div>
        <h1 className="font-semibold text-brand-dark">
          {state.isReset ? 'Elegí una contraseña nueva' : `Hola, ${state.name}`}
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          {state.isReset
            ? 'Al guardarla se cierran todas las sesiones abiertas de tu cuenta.'
            : 'Elegí la contraseña con la que vas a entrar al panel. Solo la vas a saber vos.'}
        </p>
      </div>

      {/* El email visible y con autocomplete=username: así el gestor de
          contraseñas guarda la cuenta completa y no solo la clave. */}
      <label className="block">
        <span className="block text-sm font-semibold text-brand-dark mb-2">Email</span>
        <input
          type="email"
          autoComplete="username"
          value={state.email}
          readOnly
          className={`${FIELD} bg-brand-cream text-brand-muted`}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-brand-dark mb-2">Contraseña nueva</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD}
        />
        <span className="block text-xs text-brand-muted mt-1">
          Mínimo 10 caracteres. Una frase corta es más segura y más fácil de recordar.
        </span>
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-brand-dark mb-2">Repetila</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={FIELD}
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSaving || password.length < 10 || !confirm}
        className="w-full rounded-xl bg-brand-dark text-brand-gold font-semibold py-3 disabled:opacity-40"
      >
        {isSaving ? 'Guardando…' : 'Guardar y entrar'}
      </button>
    </form>
  )
}
