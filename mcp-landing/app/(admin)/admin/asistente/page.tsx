import AdminHeader from '@/components/admin/AdminHeader'
import ChatAsistente from '@/components/admin/asistente/ChatAsistente'
import { requireOwnerPage } from '@/lib/adminSession'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Asistente · Panel MCP' }

export default async function AsistentePage() {
  await requireOwnerPage()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Asistente" subtitle="Preguntale por los números del negocio" />
      <ChatAsistente />
    </main>
  )
}
