// Link de alta o de "restablecer contraseña" sin pasar por el panel. Sirve para
// el primer dueño (sin nadie adentro no hay quién invite) y para el caso en que
// el único dueño se quedó afuera. Hace lo mismo que createInvite en lib/session.ts.
//
//   npm run admin:invite -- <email> "<Nombre>" [owner|user]
//
// Si el email no tiene cuenta la crea (dueño por defecto); si ya tiene, la deja
// como está y solo genera el link. También le limpia los intentos fallidos.
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

const SITE_URL = 'https://www.mcpmuebles.com'
const INVITE_HOURS = 48

const [rawEmail, name, role = 'owner'] = process.argv.slice(2)
if (!rawEmail || !name || !['owner', 'user'].includes(role)) {
  console.error('uso: npm run admin:invite -- <email> "<Nombre>" [owner|user]')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('falta DATABASE_URL (se lee de .env.local)')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const email = rawEmail.trim().toLowerCase()

await sql`
  insert into admin_users (id, email, name, role)
  values (${randomUUID()}::uuid, ${email}, ${name}, ${role})
  on conflict (email) do nothing
`
const [user] = await sql`
  update admin_users set active = true where email = ${email}
  returning id, name, role, (password_hash is not null) as has_password
`

const token = randomBytes(32).toString('base64url')
await sql.transaction([
  sql`update admin_invites set used_at = now() where user_id = ${user.id}::uuid and used_at is null`,
  sql`
    insert into admin_invites (token_hash, user_id, expires_at)
    values (${createHash('sha256').update(token).digest('base64url')}, ${user.id}::uuid,
            now() + make_interval(hours => ${INVITE_HOURS}))
  `,
  sql`delete from admin_login_failures where key = ${`email:${email}`}`,
])

console.log(`${user.name} <${email}> · ${user.role === 'owner' ? 'dueño' : 'usuario'}`)
console.log(user.has_password ? 'Link para restablecer la contraseña' : 'Link de alta')
console.log(`(un solo uso, vence en ${INVITE_HOURS} h):\n`)
console.log(`${SITE_URL}/admin/invitacion#${token}`)
