import InviteForm from '@/components/admin/InviteForm'

export const metadata = { title: 'Activar cuenta · Panel MCP' }

// Pública a propósito (ver PUBLIC_PATHS en middleware.ts): es donde alguien que
// todavía no tiene contraseña la elige.
export default function InvitePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-serif text-2xl text-brand-dark">MCP Muebles</div>
          <p className="text-sm text-brand-muted mt-1">CRM de contactos y consultas</p>
        </div>
        <InviteForm />
      </div>
    </main>
  )
}
