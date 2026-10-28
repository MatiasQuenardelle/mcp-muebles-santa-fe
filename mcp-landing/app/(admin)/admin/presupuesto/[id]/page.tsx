import { notFound, redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import PresupuestoEditor from '@/components/admin/PresupuestoEditor'
import { requireAdminPage } from '@/lib/adminSession'
import { getConversation, getPresupuesto } from '@/lib/db'
import type { PresupuestoData } from '@/lib/presupuesto'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Presupuesto · Panel MCP' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function PresupuestoPage({ params }: { params: { id: string } }) {
  const user = await requireAdminPage()
  const row = UUID_RE.test(params.id) ? await getPresupuesto(params.id) : null
  if (!row || !(await getConversation(row.conversation_id, user))) {
    notFound()
  }
  // El preliminar lo generó el visitante: no se edita, se mira desde la ficha.
  if (row.kind !== 'formal') {
    redirect(`/admin?c=${row.conversation_id}`)
  }
  const data = row.data as PresupuestoData

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title={`Presupuesto N° ${row.numero}`} subtitle={data.cliente} />
      <PresupuestoEditor
        // Al guardar se re-renderiza con lo de la base; la key evita que el
        // estado del formulario quede pegado a la versión anterior.
        key={row.updated_at}
        conversationId={row.conversation_id}
        presupuesto={{ id: row.id, numero: row.numero, sentAt: row.sent_at }}
        initial={data}
      />
    </main>
  )
}
