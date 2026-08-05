import type { Metadata } from 'next'

// El panel no lleva analytics ni tracker de atribución: es uso interno.
export const metadata: Metadata = {
  title: 'Panel MCP Muebles',
  robots: { index: false, follow: false, nocache: true },
  // Para que Marcelo lo agregue a la pantalla de inicio del iPhone y se abra
  // sin barra de Safari. El manifest está en public/ y no en app/ porque ahí
  // sería global y le pisaría el start_url al sitio público.
  manifest: '/admin.webmanifest',
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Panel MCP', statusBarStyle: 'default' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1a1a',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-brand-card">{children}</div>
}
