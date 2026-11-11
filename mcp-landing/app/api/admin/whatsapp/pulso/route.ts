import { NextResponse } from 'next/server'
import { getConversation } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { huellaDelPanel } from '@/lib/whatsapp/db'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const pedido = new URL(request.url).searchParams.get('c') ?? ''
  const abierta = UUID_RE.test(pedido) && (await getConversation(pedido, user)) ? pedido : null
  return NextResponse.json({ huella: await huellaDelPanel(abierta) })
}
