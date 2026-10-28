'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const FIELD =
  'w-full rounded-xl border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:border-brand-gold'
const PRIMARY =
  'rounded-xl bg-brand-dark text-brand-gold text-sm font-semibold px-4 py-2.5 disabled:opacity-40'
const SECONDARY =
  'rounded-xl border border-brand-border bg-white text-sm font-semibold px-4 py-2.5 text-brand-dark disabled:opacity-40'

async function accountAction(body: Record<string, unknown>) {
  try {
    const response = await fetch('/api/admin/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await response.json().catch(() => ({}))) as Record<string, string | undefined>
    return response.ok ? { data } : { error: data.error ?? 'No se pudo guardar.' }
  } catch {
    return { error: 'No se pudo conectar. Probá de nuevo.' }
  }
}

export default function AccountPanel({ totpEnabled }: { totpEnabled: boolean }) {
  return (
    <div className="space-y-4">
      <PasswordSection />
      <TotpSection enabled={totpEnabled} />
      <SessionsSection />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4">
      <h2 className="text-sm font-semibold text-brand-dark mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Feedback({ error, ok }: { error: string; ok: string }) {
  if (error) return <p className="text-sm text-red-700 mt-2">{error}</p>
  if (ok) return <p className="text-sm text-emerald-700 mt-2">{ok}</p>
  return null
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setOk('')
    if (next !== confirm) {
      setError('Las dos contraseñas nuevas no coinciden.')
      return
    }
    setIsSaving(true)
    const result = await accountAction({ action: 'password', current, next })
    setIsSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setError('')
    setOk('Listo. Se cerraron las sesiones en los otros dispositivos.')
    setCurrent('')
    setNext('')
    setConfirm('')
  }

  return (
    <Section title="Cambiar contraseña">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Actual"
          aria-label="Contraseña actual"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={FIELD}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Nueva (mín. 10)"
          aria-label="Contraseña nueva"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={FIELD}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Repetir la nueva"
          aria-label="Repetir la contraseña nueva"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={FIELD}
        />
        <div className="sm:col-span-3">
          <button type="submit" disabled={isSaving || !current || next.length < 10} className={PRIMARY}>
            {isSaving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
          <Feedback error={error} ok={ok} />
        </div>
      </form>
    </Section>
  )
}

function TotpSection({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [setup, setSetup] = useState<{ secret: string; uri: string; qr: string } | null>(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)
  const [error, setError] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  async function run(body: Record<string, unknown>) {
    setIsWorking(true)
    const result = await accountAction(body)
    setIsWorking(false)
    setError(result.error ?? '')
    return result
  }

  async function start() {
    const result = await run({ action: 'totp-start' })
    if (result.data?.secret && result.data.uri && result.data.qr) {
      setSetup({ secret: result.data.secret, uri: result.data.uri, qr: result.data.qr })
    }
  }

  async function confirmCode(event: React.FormEvent) {
    event.preventDefault()
    const result = await run({ action: 'totp-confirm', code })
    if (!result.error) {
      setSetup(null)
      setCode('')
      router.refresh()
    }
  }

  async function disable(event: React.FormEvent) {
    event.preventDefault()
    const result = await run({ action: 'totp-disable', password })
    if (!result.error) {
      setIsDisabling(false)
      setPassword('')
      router.refresh()
    }
  }

  if (enabled) {
    return (
      <Section title="Verificación en dos pasos">
        <p className="text-sm text-brand-dark">
          <span className="font-semibold text-emerald-700">✓ Activada.</span> Además de la contraseña,
          al entrar se pide el código de tu app de autenticación.
        </p>
        {isDisabling ? (
          <form onSubmit={disable} className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña para confirmar"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD}
            />
            <button type="submit" disabled={isWorking || !password} className={SECONDARY}>
              Desactivar
            </button>
          </form>
        ) : (
          <button onClick={() => setIsDisabling(true)} className={`${SECONDARY} mt-3`}>
            Desactivar
          </button>
        )}
        <Feedback error={error} ok="" />
      </Section>
    )
  }

  return (
    <Section title="Verificación en dos pasos">
      {!setup ? (
        <>
          <p className="text-sm text-brand-muted">
            Recomendado. Aunque alguien consiga tu contraseña, no puede entrar sin el código que
            genera tu celular. Funciona con Google Authenticator, 1Password, Authy o la app de
            Contraseñas del iPhone.
          </p>
          <button onClick={start} disabled={isWorking} className={`${PRIMARY} mt-3`}>
            {isWorking ? 'Preparando…' : 'Activar'}
          </button>
        </>
      ) : (
        <form onSubmit={confirmCode}>
          <ol className="text-sm text-brand-dark space-y-2 list-decimal pl-5">
            <li>
              Escaneá este código con la app.{' '}
              <span className="text-brand-muted">
                Si estás en el celular, tocá{' '}
                <a href={setup.uri} className="underline underline-offset-2">
                  agregar a la app
                </a>
                .
              </span>
            </li>
          </ol>
          <div
            className="w-[200px] h-[200px] my-3 mx-auto sm:mx-0 [&_svg]:w-full [&_svg]:h-full"
            // SVG generado en el server por la librería qrcode a partir de la URI:
            // no lleva nada que haya escrito el usuario.
            dangerouslySetInnerHTML={{ __html: setup.qr }}
          />
          <p className="text-xs text-brand-muted">
            ¿No podés escanear? Cargá esta clave a mano:{' '}
            <code className="text-brand-dark break-all select-all">{setup.secret}</code>
          </p>
          <ol start={2} className="text-sm text-brand-dark space-y-2 list-decimal pl-5 mt-3">
            <li>Escribí los 6 números que muestra la app.</li>
          </ol>
          <div className="flex gap-2 mt-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`${FIELD} max-w-[160px] tracking-[0.3em] text-center tabular-nums`}
            />
            <button type="submit" disabled={isWorking || code.trim().length < 6} className={PRIMARY}>
              Confirmar
            </button>
          </div>
          <Feedback error={error} ok="" />
        </form>
      )}
      {!setup ? <Feedback error={error} ok="" /> : null}
    </Section>
  )
}

function SessionsSection() {
  const router = useRouter()
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  async function logoutOthers() {
    const result = await accountAction({ action: 'logout-others' })
    setError(result.error ?? '')
    setOk(result.error ? '' : 'Listo. Solo queda abierta esta sesión.')
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <Section title="Sesiones">
      <p className="text-sm text-brand-muted">
        Si entraste desde una compu ajena o perdiste el celular, cerrá las demás sesiones.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={logoutOthers} className={SECONDARY}>
          Cerrar sesión en los otros dispositivos
        </button>
        <button onClick={logout} className={SECONDARY}>
          Salir de este
        </button>
      </div>
      <Feedback error={error} ok={ok} />
    </Section>
  )
}
