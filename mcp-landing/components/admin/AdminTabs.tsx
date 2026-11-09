'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { gruposPara, navActiva, type RolNav } from '@/lib/gestion/nav'

export default function AdminTabs({ rol }: { rol: RolNav }) {
  const ruta = usePathname()
  const grupos = gruposPara(rol)
  const { grupo: activo, chip: chipActivo } = navActiva(ruta, rol)
  const chips = activo && ruta !== '/admin/mas' ? activo.chips : []

  return (
    <nav className="mb-4 space-y-2" aria-label="Secciones del panel">
      <div className="flex gap-1 bg-white rounded-xl border border-brand-border p-1">
        {grupos.map((grupo) => (
          <Link
            key={grupo.id}
            href={grupo.href}
            aria-current={grupo.id === activo?.id ? 'page' : undefined}
            className={`flex-1 min-w-0 text-center text-xs sm:text-sm font-semibold py-2 rounded-lg whitespace-nowrap transition-colors ${
              grupo.id === activo?.id ? 'bg-brand-dark text-brand-gold' : 'text-brand-muted'
            }`}
          >
            {grupo.label}
          </Link>
        ))}
      </div>
      {chips.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              aria-current={chip.href === chipActivo?.href ? 'page' : undefined}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap ${
                chip.href === chipActivo?.href
                  ? 'bg-brand-dark text-brand-gold border-brand-dark'
                  : 'bg-white text-brand-muted border-brand-border'
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  )
}
