import Link from 'next/link'
import AdminTabs from '@/components/admin/AdminTabs'
import LogoutButton from '@/components/admin/LogoutButton'

// Cabecera común de las pantallas del panel: título, alta rápida y pestañas.
export default function AdminHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl text-brand-dark leading-tight">{title}</h1>
          <p className="text-xs text-brand-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/admin/nuevo"
            className="rounded-full bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-1.5"
          >
            + Nuevo
          </Link>
          <LogoutButton />
        </div>
      </header>
      <AdminTabs />
    </>
  )
}
