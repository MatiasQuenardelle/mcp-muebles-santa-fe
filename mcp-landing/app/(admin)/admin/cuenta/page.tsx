import Link from 'next/link'
import AccountPanel from '@/components/admin/AccountPanel'
import AdminHeader from '@/components/admin/AdminHeader'
import { requireAdminPage } from '@/lib/adminSession'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mi cuenta · Panel MCP' }

export default async function AccountPage() {
  const user = await requireAdminPage()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Mi cuenta" subtitle={`${user.name} · ${user.email}`} />

      {user.role === 'owner' ? (
        <Link
          href="/admin/usuarios"
          className="flex items-center justify-between bg-white rounded-2xl border border-brand-border p-4 mb-4"
        >
          <span>
            <span className="block text-sm font-semibold text-brand-dark">Usuarios del panel</span>
            <span className="block text-xs text-brand-muted">
              Invitar gente, dar de baja, restablecer contraseñas
            </span>
          </span>
          <span aria-hidden className="text-brand-muted">
            →
          </span>
        </Link>
      ) : null}

      <AccountPanel totpEnabled={user.totp_enabled} />
    </main>
  )
}
