import { NextResponse } from 'next/server'
import { presupuestoPdfResponse } from '@/components/pdf/render'
import { getConversation, getPresupuesto } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Descarga el PDF para mandarlo por WhatsApp desde el celular.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const row = UUID_RE.test(params.id) ? await getPresupuesto(params.id) : null
  if (!row || !(await getConversation(row.conversation_id, user))) {
    return NextResponse.json({ error: 'No se encontró ese presupuesto.' }, { status: 404 })
  }
  return presupuestoPdfResponse(row, 'attachment')
}
