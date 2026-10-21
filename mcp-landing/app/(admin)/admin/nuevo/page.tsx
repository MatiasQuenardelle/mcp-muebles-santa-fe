import AdminHeader from '@/components/admin/AdminHeader'
import NewLeadForm from '@/components/admin/NewLeadForm'
import { requireAdminPage } from '@/lib/adminSession'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Nuevo contacto · Panel MCP' }

export default async function NewLeadPage() {
  await requireAdminPage()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader
        title="Nuevo contacto"
        subtitle="Para los que llegaron por WhatsApp, Instagram, teléfono o el local"
      />
      <NewLeadForm />
    </main>
  )
}
