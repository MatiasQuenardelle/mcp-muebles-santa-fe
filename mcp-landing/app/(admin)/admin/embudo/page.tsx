import AdminHeader from '@/components/admin/AdminHeader'
import KanbanBoard, { type KanbanItem } from '@/components/admin/KanbanBoard'
import { contactView, leadOrigin } from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { isDatabaseConfigured, listAllConversations } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Embudo · Panel MCP' }

// Los perdidos viejos no aportan al tablero: se muestran solo los últimos 60 días.
const LOST_WINDOW_MS = 60 * 86_400_000

export default async function PipelinePage() {
  await requireAdminPage()

  const rows = isDatabaseConfigured() ? await listAllConversations() : []
  const cutoff = Date.now() - LOST_WINDOW_MS

  const items: KanbanItem[] = rows
    .filter(
      (row) =>
        row.status !== 'perdido' ||
        new Date(row.status_changed_at ?? row.last_message_at).getTime() > cutoff
    )
    .map((row) => {
      const contact = contactView(row)
      return {
        id: row.id,
        nombre: contact.nombre ?? contact.telefono,
        proyecto: contact.proyecto,
        origen: leadOrigin(row),
        status: row.status,
        amount: row.amount,
        temperatura: row.card?.temperatura ?? null,
        followUpOn: row.follow_up_on,
      }
    })

  return (
    <main className="px-4 py-6 sm:px-6">
      <div className="max-w-3xl">
        <AdminHeader
          title="Embudo"
          subtitle="Arrastrá las tarjetas para cambiar el estado · tocá una para abrir la ficha"
        />
      </div>
      <KanbanBoard items={items} />
    </main>
  )
}
