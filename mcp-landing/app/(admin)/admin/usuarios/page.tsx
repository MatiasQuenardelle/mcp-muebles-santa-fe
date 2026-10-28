import AdminHeader from '@/components/admin/AdminHeader'
import UsersPanel, { type UserItem } from '@/components/admin/UsersPanel'
import { requireOwnerPage } from '@/lib/adminSession'
import { listUsers } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Usuarios · Panel MCP' }

export default async function UsersPage() {
  const owner = await requireOwnerPage()
  const rows = await listUsers()

  const users: UserItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    hasPassword: row.has_password,
    inviteExpiresAt: row.invite_expires_at,
    lastLoginAt: row.last_login_at,
    openSessions: row.open_sessions,
    totpEnabled: row.totp_enabled,
    isSelf: row.id === owner.id,
  }))

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Usuarios" subtitle="Quién puede entrar al panel" />
      <UsersPanel users={users} />
    </main>
  )
}
