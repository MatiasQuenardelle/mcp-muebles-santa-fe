import Link from 'next/link'
import AdminTabs from '@/components/admin/AdminTabs'
import ContactAvatar from '@/components/admin/ContactAvatar'
import { getCurrentUser } from '@/lib/adminSession'

// Cabecera común de las pantallas del panel: título, alta rápida, acceso a la
// cuenta propia (contraseña, 2 pasos, salir) y pestañas.
export default async function AdminHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const user = await getCurrentUser()

  return (
    <>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl text-brand-dark leading-tight">{title}</h1>
          <p className="text-xs text-brand-muted truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/admin/nuevo"
            className="rounded-full bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-1.5"
          >
            + Nuevo
          </Link>
          {user ? (
            <Link href="/admin/cuenta" aria-label={`Mi cuenta (${user.name})`} title="Mi cuenta">
              <ContactAvatar name={user.name} size={30} />
            </Link>
          ) : null}
        </div>
      </header>
      <AdminTabs />
    </>
  )
}
