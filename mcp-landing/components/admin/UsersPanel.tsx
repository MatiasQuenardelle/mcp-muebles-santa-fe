'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ContactAvatar from '@/components/admin/ContactAvatar'
import { formatRelative } from '@/lib/adminFormat'

export interface UserItem {
  id: string
  name: string
  email: string
  role: 'owner' | 'user'
  active: boolean
  hasPassword: boolean
  inviteExpiresAt: string | null
  lastLoginAt: string | null
  openSessions: number
  totpEnabled: boolean
  isSelf: boolean
}

const FIELD =
  'w-full rounded-xl border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:border-brand-gold'
const SMALL =
  'text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-border bg-white text-brand-dark disabled:opacity-40'

async function post(url: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await response.json().catch(() => ({}))) as { error?: string; inviteUrl?: string }
    return response.ok ? { inviteUrl: data.inviteUrl } : { error: data.error ?? 'No se pudo.' }
  } catch {
    return { error: 'No se pudo conectar.' }
  }
}

// El link se muestra una vez, acá: en la base solo queda su hash.
function InviteLink({ name, url, onClose }: { name: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const message = encodeURIComponent(
    `Hola ${name}, te paso el acceso al panel de MCP Muebles. Entrá a este link y elegí tu contraseña (vence en 48 h y sirve una sola vez):\n${url}`
  )

  return (
    <div className="bg-brand-gold/10 border border-brand-gold/60 rounded-2xl p-4 mb-4">
      <p className="text-sm font-semibold text-brand-dark">Link para {name}</p>
      <p className="text-xs text-brand-muted mt-0.5">
        Sirve una sola vez y vence en 48 h. Con él elige su propia contraseña: vos nunca la ves. No
        se puede volver a mostrar; si se pierde, generá otro.
      </p>
      <code className="block text-xs text-brand-dark bg-white border border-brand-border rounded-lg px-3 py-2 mt-3 break-all select-all">
        {url}
      </code>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(url).catch(() => {})
            setCopied(true)
          }}
          className={SMALL}
        >
          {copied ? '¡Copiado!' : 'Copiar link'}
        </button>
        <a
          href={`https://wa.me/?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${SMALL} !bg-brand-green !text-white !border-brand-green`}
        >
          Mandar por WhatsApp
        </a>
        <button onClick={onClose} className={`${SMALL} ml-auto`}>
          Listo
        </button>
      </div>
    </div>
  )
}

export default function UsersPanel({ users }: { users: UserItem[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'owner'>('user')
  const [invite, setInvite] = useState<{ name: string; url: string } | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setBusyId('new')
    const result = await post('/api/admin/users', { name, email, role })
    setBusyId(null)
    if (result.error || !result.inviteUrl) {
      setError(result.error ?? 'No se pudo crear.')
      return
    }
    setError('')
    setInvite({ name: name.trim(), url: result.inviteUrl })
    setName('')
    setEmail('')
    setRole('user')
    router.refresh()
  }

  async function act(user: UserItem, action: string, confirmText?: string, extra = {}) {
    if (confirmText && !window.confirm(confirmText)) {
      return
    }
    setBusyId(user.id)
    const result = await post(`/api/admin/users/${user.id}`, { action, ...extra })
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setError('')
    if (result.inviteUrl) {
      setInvite({ name: user.name, url: result.inviteUrl })
    }
    router.refresh()
  }

  return (
    <div>
      {invite ? <InviteLink name={invite.name} url={invite.url} onClose={() => setInvite(null)} /> : null}
      {error ? <p className="text-sm text-red-700 mb-3">{error}</p> : null}

      <ul className="space-y-2 mb-6">
        {users.map((user) => {
          const status = !user.active
            ? { label: 'Dado de baja', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
            : !user.hasPassword
              ? user.inviteExpiresAt
                ? { label: 'Invitación pendiente', className: 'bg-brand-gold/15 text-brand-dark border-brand-gold/50' }
                : { label: 'Invitación vencida', className: 'bg-red-50 text-red-700 border-red-200' }
              : { label: 'Activo', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
          const busy = busyId === user.id

          return (
            <li key={user.id} className="bg-white rounded-2xl border border-brand-border p-4">
              <div className="flex items-start gap-3">
                <ContactAvatar name={user.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-brand-dark">{user.name}</span>
                    {user.isSelf ? <span className="text-[11px] text-brand-muted">(vos)</span> : null}
                    <span className={`text-[10px] font-semibold px-1.5 rounded-full border ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 rounded-full border border-brand-border text-brand-muted">
                      {user.role === 'owner' ? 'Dueño' : 'Usuario'}
                    </span>
                    {user.totpEnabled ? (
                      <span className="text-[10px] font-semibold px-1.5 rounded-full border border-emerald-200 text-emerald-800">
                        2 pasos
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-brand-muted truncate">{user.email}</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">
                    {user.lastLoginAt ? `Último ingreso ${formatRelative(user.lastLoginAt)}` : 'Nunca ingresó'}
                    {user.openSessions > 0
                      ? ` · ${user.openSessions} sesión${user.openSessions === 1 ? '' : 'es'} abierta${user.openSessions === 1 ? '' : 's'}`
                      : ''}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.active ? (
                  <button disabled={busy} onClick={() => act(user, 'invite')} className={SMALL}>
                    {user.hasPassword ? 'Link para restablecer contraseña' : 'Generar link de invitación'}
                  </button>
                ) : null}
                {!user.isSelf && user.active && user.openSessions > 0 ? (
                  <button disabled={busy} onClick={() => act(user, 'logout')} className={SMALL}>
                    Cerrar sus sesiones
                  </button>
                ) : null}
                {!user.isSelf && user.totpEnabled ? (
                  <button
                    disabled={busy}
                    onClick={() =>
                      act(user, 'reset-totp', `¿Apagar la verificación en dos pasos de ${user.name}? Usalo si perdió el celular.`)
                    }
                    className={SMALL}
                  >
                    Resetear 2 pasos
                  </button>
                ) : null}
                {!user.isSelf ? (
                  <button
                    disabled={busy}
                    onClick={() => act(user, 'role', undefined, { role: user.role === 'owner' ? 'user' : 'owner' })}
                    className={SMALL}
                  >
                    {user.role === 'owner' ? 'Pasar a usuario' : 'Hacer dueño'}
                  </button>
                ) : null}
                {!user.isSelf ? (
                  user.active ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        act(user, 'deactivate', `¿Dar de baja a ${user.name}? Se le cierran las sesiones y no puede volver a entrar.`)
                      }
                      className={`${SMALL} !text-red-700`}
                    >
                      Dar de baja
                    </button>
                  ) : (
                    <button disabled={busy} onClick={() => act(user, 'activate')} className={SMALL}>
                      Reactivar
                    </button>
                  )
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-brand-border p-4">
        <h2 className="text-sm font-semibold text-brand-dark mb-3">Invitar a alguien</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            placeholder="Nombre"
            aria-label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
          <input
            type="email"
            inputMode="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD}
          />
          <select
            aria-label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'owner')}
            className={`${FIELD} bg-white`}
          >
            <option value="user">Usuario</option>
            <option value="owner">Dueño</option>
          </select>
        </div>
        <p className="text-xs text-brand-muted mt-2">
          Usuario (empleado): ve los contactos que tiene a cargo y los sin asignar, que puede
          tomar. Dueño: ve todo, reparte contactos, borra, descarga la planilla y administra los
          usuarios.
        </p>
        <button
          type="submit"
          disabled={busyId === 'new' || !name.trim() || !email.trim()}
          className="mt-3 rounded-xl bg-brand-dark text-brand-gold text-sm font-semibold px-4 py-2.5 disabled:opacity-40"
        >
          {busyId === 'new' ? 'Creando…' : 'Crear y generar link'}
        </button>
      </form>
    </div>
  )
}
