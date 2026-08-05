import LoginForm from '@/components/admin/LoginForm'

export const metadata = { title: 'Ingresar · Panel MCP' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  // Solo se aceptan rutas internas: un "next" externo sería un open redirect.
  const next = searchParams.next
  const target = next && next.startsWith('/admin') ? next : '/admin'

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-serif text-2xl text-brand-dark">MCP Muebles</div>
          <p className="text-sm text-brand-muted mt-1">Panel de consultas del asistente</p>
        </div>
        <LoginForm next={target} />
      </div>
    </main>
  )
}
