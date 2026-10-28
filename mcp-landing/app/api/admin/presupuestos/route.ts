import { NextResponse } from 'next/server'
import { InputError, parsePresupuestoData } from '@/lib/adminInput'
import { createPresupuesto, getConversation } from '@/lib/db'
import { calcular } from '@/lib/presupuesto'
import { requireAdmin } from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Presupuesto formal nuevo para un contacto. Devuelve id y número.
export async function POST(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const conversationId = body?.conversationId
  if (typeof conversationId !== 'string' || !UUID_RE.test(conversationId)) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  let data
  try {
    data = parsePresupuestoData(body?.data)
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
  if (!(await getConversation(conversationId, user))) {
    return NextResponse.json({ error: 'No se encontró ese contacto.' }, { status: 404 })
  }

  try {
    const created = await createPresupuesto({
      conversationId,
      kind: 'formal',
      data,
      total: calcular(data).total,
      userId: user.id,
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error('No se pudo crear el presupuesto', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
