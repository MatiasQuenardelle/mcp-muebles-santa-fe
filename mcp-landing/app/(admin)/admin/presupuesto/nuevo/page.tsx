import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import PresupuestoEditor from '@/components/admin/PresupuestoEditor'
import { todayKey } from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { getConversation, lastFormalItems } from '@/lib/db'
import { ITEMS_DEFAULT, presupuestoNuevo } from '@/lib/presupuesto'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Nuevo presupuesto · Panel MCP' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Arranca con los datos del contacto y los precios del último presupuesto.
export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: { c?: string }
}) {
  const user = await requireAdminPage()
  const conversationId = searchParams.c ?? ''
  const conversation = UUID_RE.test(conversationId)
    ? await getConversation(conversationId, user)
    : null
  if (!conversation) {
    notFound()
  }

  const initial = presupuestoNuevo(
    {
      cliente: conversation.name ?? '',
      localidad: conversation.zona ?? '',
      proyecto: conversation.project ?? '',
    },
    (await lastFormalItems()) ?? ITEMS_DEFAULT,
    todayKey()
  )

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader
        title="Nuevo presupuesto"
        subtitle={`Para ${conversation.name ?? 'este contacto'} · los precios son los del último`}
      />
      <PresupuestoEditor conversationId={conversation.id} presupuesto={null} initial={initial} />
    </main>
  )
}
