import AdminHeader from '@/components/admin/AdminHeader'
import NuevaObraForm from '@/components/admin/obras/NuevaObraForm'
import { requireOwnerPage } from '@/lib/adminSession'
import { listarVendedores } from '@/lib/gestion/obras'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Nueva obra · Panel MCP' }

export default async function NuevaObraPage() {
  await requireOwnerPage()
  const vendedores = await listarVendedores()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Nueva obra" subtitle="Para cargar un trabajo que ya está en marcha" />
      <NuevaObraForm vendedores={vendedores} />
    </main>
  )
}
