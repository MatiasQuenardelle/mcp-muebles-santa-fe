// Server-only (Node): usuarios, sesiones e invitaciones del panel.
// La cookie (lib/auth.ts) solo prueba que la sesión la emitimos nosotros; acá
// se confirma contra la base que siga vigente, que no se haya cerrado y que el
// usuario siga activo. Así dar de baja a alguien lo saca en el acto.

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_DAYS,
  randomToken,
  readCookie,
  readSessionCookie,
  sha256Base64url,
  signSessionCookie,
} from '@/lib/auth'
import { db } from '@/lib/db'

export type AdminRole = 'owner' | 'user'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  totp_enabled: boolean
}

const USER_COLUMNS = 'u.id, u.email, u.name, u.role, u.totp_enabled'

export const INVITE_HOURS = 48
// 5 fallos por email o 20 por IP en 15 minutos traban el login un rato.
const FAILURE_WINDOW_MINUTES = 15
const MAX_FAILURES_PER_EMAIL = 5
const MAX_FAILURES_PER_IP = 20

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// ---------------------------------------------------------------------------
// Sesiones
// ---------------------------------------------------------------------------

export async function getUserBySessionToken(sessionToken: string): Promise<AdminUser | null> {
  const sql = db()
  const rows = (await sql.query(
    `
    select ${USER_COLUMNS}
    from admin_sessions s
    join admin_users u on u.id = s.user_id
    where s.token_hash = $1
      and s.revoked_at is null
      and s.expires_at > now()
      and u.active
    `,
    [await sha256Base64url(sessionToken)]
  )) as unknown as AdminUser[]
  return rows[0] ?? null
}

export async function userFromCookie(cookie: string | null | undefined): Promise<AdminUser | null> {
  const sessionToken = await readSessionCookie(cookie)
  return sessionToken ? getUserBySessionToken(sessionToken) : null
}

/**
 * Re-verificación en cada route handler de /api/admin/*. El middleware solo no
 * alcanza: la familia next 14.2 tuvo un bypass de auth por middleware
 * (CVE-2025-29927), y además el middleware no puede saber si la sesión se cerró.
 *
 * En los pedidos que escriben se exige que el Origin sea el propio sitio: la
 * cookie es SameSite=Lax, pero esto corta cualquier intento cross-site igual.
 */
export async function requireAdmin(request: Request): Promise<AdminUser | null> {
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return null
    }
  }
  return userFromCookie(readCookie(request, ADMIN_COOKIE))
}

export async function requireOwner(request: Request): Promise<AdminUser | null> {
  const user = await requireAdmin(request)
  return user?.role === 'owner' ? user : null
}

/** Crea la sesión y devuelve el valor de la cookie ya firmado. */
export async function createSession(userId: string, userAgent: string | null) {
  const sql = db()
  const sessionToken = randomToken()
  const expiresAt = Date.now() + ADMIN_SESSION_DAYS * 86_400_000
  await sql.transaction([
    sql`
      insert into admin_sessions (token_hash, user_id, expires_at, user_agent)
      values (${await sha256Base64url(sessionToken)}, ${userId}::uuid,
              ${new Date(expiresAt).toISOString()}::timestamptz, ${userAgent?.slice(0, 300) ?? null})
    `,
    sql`update admin_users set last_login_at = now() where id = ${userId}::uuid`,
  ])
  const cookie = await signSessionCookie(sessionToken, expiresAt)
  if (!cookie) {
    throw new Error('ADMIN_SESSION_SECRET no está configurada')
  }
  return { cookie, maxAge: ADMIN_SESSION_DAYS * 86_400 }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export async function revokeSessionFromCookie(cookie: string | null): Promise<void> {
  const sessionToken = await readSessionCookie(cookie)
  if (!sessionToken) {
    return
  }
  const sql = db()
  await sql`
    update admin_sessions set revoked_at = now()
    where token_hash = ${await sha256Base64url(sessionToken)} and revoked_at is null
  `
}

export async function revokeAllSessions(userId: string): Promise<void> {
  const sql = db()
  await sql`
    update admin_sessions set revoked_at = now()
    where user_id = ${userId}::uuid and revoked_at is null
  `
}

// "Cerrar sesión en los otros dispositivos": deja viva solo la de la cookie actual.
export async function revokeOtherSessions(userId: string, cookie: string | null): Promise<void> {
  const sessionToken = await readSessionCookie(cookie)
  const keep = sessionToken ? await sha256Base64url(sessionToken) : ''
  const sql = db()
  await sql`
    update admin_sessions set revoked_at = now()
    where user_id = ${userId}::uuid and revoked_at is null and token_hash <> ${keep}
  `
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export interface LoginCandidate extends AdminUser {
  password_hash: string | null
  totp_secret: string | null
  active: boolean
}

export async function findUserForLogin(email: string): Promise<LoginCandidate | null> {
  const sql = db()
  const rows = (await sql.query(
    `select ${USER_COLUMNS}, u.password_hash, u.totp_secret, u.active
     from admin_users u where u.email = $1`,
    [normalizeEmail(email)]
  )) as unknown as LoginCandidate[]
  return rows[0] ?? null
}

export async function getLoginCandidate(userId: string): Promise<LoginCandidate | null> {
  const sql = db()
  const rows = (await sql.query(
    `select ${USER_COLUMNS}, u.password_hash, u.totp_secret, u.active
     from admin_users u where u.id = $1::uuid`,
    [userId]
  )) as unknown as LoginCandidate[]
  return rows[0] ?? null
}

/** true si alguna de las claves (email, IP) ya pasó su tope de fallos. */
export async function isLoginLocked(emailKey: string, ipKey: string | null): Promise<boolean> {
  const sql = db()
  const rows = (await sql.query(
    `
    select
      count(*) filter (where key = $1)::int as by_email,
      count(*) filter (where key = $2)::int as by_ip
    from admin_login_failures
    where key in ($1, $2) and created_at > now() - interval '${FAILURE_WINDOW_MINUTES} minutes'
    `,
    [emailKey, ipKey ?? '']
  )) as Array<{ by_email: number; by_ip: number }>
  const counts = rows[0] ?? { by_email: 0, by_ip: 0 }
  return counts.by_email >= MAX_FAILURES_PER_EMAIL || counts.by_ip >= MAX_FAILURES_PER_IP
}

export async function recordLoginFailure(emailKey: string, ipKey: string | null): Promise<void> {
  const sql = db()
  await sql.query(
    `insert into admin_login_failures (key) select unnest($1::text[])`,
    [[emailKey, ipKey].filter(Boolean)]
  )
  // Limpieza perezosa: no hace falta un cron para una tabla que crece de a poco.
  await sql`delete from admin_login_failures where created_at < now() - interval '1 day'`
}

export async function clearLoginFailures(emailKey: string): Promise<void> {
  const sql = db()
  await sql`delete from admin_login_failures where key = ${emailKey}`
}

export const LOCKOUT_MESSAGE = `Demasiados intentos. Esperá ${FAILURE_WINDOW_MINUTES} minutos y probá de nuevo.`

// ---------------------------------------------------------------------------
// Invitaciones (alta y restablecer contraseña)
// ---------------------------------------------------------------------------

// El token va en el fragmento (#): el navegador no lo manda al server, así que
// no queda en los logs de Vercel ni viaja en un Referer.
export function inviteUrl(request: Request, token: string): string {
  return `${new URL(request.url).origin}/admin/invitacion#${token}`
}

/** Genera un link nuevo y anula los anteriores sin usar de ese usuario. */
export async function createInvite(userId: string): Promise<string> {
  const sql = db()
  const token = randomToken()
  await sql.transaction([
    sql`
      update admin_invites set used_at = now()
      where user_id = ${userId}::uuid and used_at is null
    `,
    sql`
      insert into admin_invites (token_hash, user_id, expires_at)
      values (${await sha256Base64url(token)}, ${userId}::uuid,
              now() + make_interval(hours => ${INVITE_HOURS}))
    `,
  ])
  return token
}

export async function getInviteUser(
  token: string
): Promise<(AdminUser & { has_password: boolean }) | null> {
  const sql = db()
  const rows = (await sql.query(
    `
    select ${USER_COLUMNS}, (u.password_hash is not null) as has_password
    from admin_invites i
    join admin_users u on u.id = i.user_id
    where i.token_hash = $1 and i.used_at is null and i.expires_at > now() and u.active
    `,
    [await sha256Base64url(token)]
  )) as unknown as Array<AdminUser & { has_password: boolean }>
  return rows[0] ?? null
}

/**
 * Usa el link y guarda la contraseña. El UPDATE con `used_at is null` hace de
 * lock: dos pedidos con el mismo link no pueden usarlo los dos. Cierra todas las
 * sesiones anteriores (si era un "restablecer", alguien pudo haberla tenido).
 */
export async function consumeInvite(token: string, passwordHash: string): Promise<string | null> {
  const sql = db()
  const rows = (await sql`
    update admin_invites i set used_at = now()
    from admin_users u
    where i.token_hash = ${await sha256Base64url(token)}
      and i.used_at is null and i.expires_at > now()
      and u.id = i.user_id and u.active
    returning i.user_id
  `) as Array<{ user_id: string }>
  const userId = rows[0]?.user_id
  if (!userId) {
    return null
  }
  await setPassword(userId, passwordHash)
  await revokeAllSessions(userId)
  return userId
}

// ---------------------------------------------------------------------------
// Cuenta propia y administración
// ---------------------------------------------------------------------------

export async function setPassword(userId: string, passwordHash: string): Promise<void> {
  const sql = db()
  await sql`update admin_users set password_hash = ${passwordHash} where id = ${userId}::uuid`
}

export async function setTotp(
  userId: string,
  encryptedSecret: string | null,
  enabled: boolean
): Promise<void> {
  const sql = db()
  await sql`
    update admin_users set totp_secret = ${encryptedSecret}, totp_enabled = ${enabled}
    where id = ${userId}::uuid
  `
}

export interface AdminUserListRow extends AdminUser {
  active: boolean
  has_password: boolean
  invite_expires_at: string | null
  created_at: string
  last_login_at: string | null
  open_sessions: number
}

export async function listUsers(): Promise<AdminUserListRow[]> {
  const sql = db()
  const rows = await sql.query(`
    select ${USER_COLUMNS}, u.active, (u.password_hash is not null) as has_password,
           u.created_at, u.last_login_at,
           (select max(expires_at) from admin_invites
             where user_id = u.id and used_at is null and expires_at > now()) as invite_expires_at,
           (select count(*)::int from admin_sessions
             where user_id = u.id and revoked_at is null and expires_at > now()) as open_sessions
    from admin_users u
    order by u.role = 'owner' desc, u.created_at asc
  `)
  return rows as unknown as AdminUserListRow[]
}

// Los que pueden quedar a cargo de un contacto: el selector de responsable y
// el resumen por persona de Inicio.
export async function listTeam(): Promise<Array<{ id: string; name: string }>> {
  const sql = db()
  const rows = await sql`
    select id, name from admin_users where active order by role = 'owner' desc, name
  `
  return rows as Array<{ id: string; name: string }>
}

export async function createUser(input: {
  email: string
  name: string
  role: AdminRole
}): Promise<string | null> {
  const sql = db()
  const id = crypto.randomUUID()
  const rows = (await sql`
    insert into admin_users (id, email, name, role)
    values (${id}::uuid, ${normalizeEmail(input.email)}, ${input.name}, ${input.role})
    on conflict (email) do nothing
    returning id
  `) as Array<{ id: string }>
  return rows[0]?.id ?? null
}

export async function updateUser(
  userId: string,
  fields: { active?: boolean; role?: AdminRole; name?: string }
): Promise<void> {
  const sql = db()
  if (fields.active !== undefined) {
    await sql`update admin_users set active = ${fields.active} where id = ${userId}::uuid`
    if (!fields.active) {
      await revokeAllSessions(userId)
    }
  }
  if (fields.role !== undefined) {
    await sql`update admin_users set role = ${fields.role} where id = ${userId}::uuid`
  }
  if (fields.name !== undefined) {
    await sql`update admin_users set name = ${fields.name} where id = ${userId}::uuid`
  }
}

export async function countActiveOwners(): Promise<number> {
  const sql = db()
  const rows = (await sql`
    select count(*)::int as total from admin_users where role = 'owner' and active
  `) as Array<{ total: number }>
  return rows[0]?.total ?? 0
}

export async function getUser(userId: string): Promise<(AdminUser & { active: boolean }) | null> {
  const sql = db()
  const rows = (await sql.query(
    `select ${USER_COLUMNS}, u.active from admin_users u where u.id = $1::uuid`,
    [userId]
  )) as unknown as Array<AdminUser & { active: boolean }>
  return rows[0] ?? null
}
