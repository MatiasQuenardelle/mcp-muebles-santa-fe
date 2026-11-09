import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import { requireOwnerPage } from '@/lib/adminSession'
import { ACCESOS_MAS } from '@/lib/gestion/nav'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Más · Panel MCP' }

export default async function MasPage() {
  await requireOwnerPage()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Más" subtitle="El resto de la empresa" />
      <ul className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border/60">
        {ACCESOS_MAS.map((acceso) => (
          <li key={acceso.href}>
            <Link href={acceso.href} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-brand-dark">{acceso.label}</span>
                <span className="block text-xs text-brand-muted truncate">{acceso.detalle}</span>
              </span>
              <span className="text-brand-muted flex-shrink-0" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
