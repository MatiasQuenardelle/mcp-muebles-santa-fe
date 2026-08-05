'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Chats' },
  { href: '/admin/whatsapp', label: 'WhatsApp' },
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
            className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${
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
