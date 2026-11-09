import AdminHeader from '@/components/admin/AdminHeader'
import NotasPanel from '@/components/admin/caja/NotasPanel'
import { requireOwnerPage } from '@/lib/adminSession'
import { listarNotas } from '@/lib/gestion/caja'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Empresa · Panel MCP' }

export default async function EmpresaPage() {
  await requireOwnerPage()
  const notas = await listarNotas()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Empresa" subtitle="Datos importantes de MCP" />
      <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <strong>No guardes contraseñas acá.</strong> Esto es para datos como el CUIT, los seguros o los contactos útiles.
      </p>
      <NotasPanel notas={notas} />
    </main>
  )
}
