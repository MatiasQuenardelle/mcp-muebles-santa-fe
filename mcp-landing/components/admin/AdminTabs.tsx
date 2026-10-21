'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/inicio', label: 'Inicio' },
  { href: '/admin', label: 'Contactos' },
  { href: '/admin/embudo', label: 'Embudo' },
  { href: '/admin/whatsapp', label: 'Clics WA' },
]

export default function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 bg-white rounded-xl border border-brand-border p-1 mb-4">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 text-center text-xs sm:text-sm font-semibold py-2 rounded-lg whitespace-nowrap transition-colors ${
              isActive ? 'bg-brand-dark text-brand-gold' : 'text-brand-muted'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
