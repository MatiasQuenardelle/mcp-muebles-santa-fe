import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { isManualActivityKind } from '@/lib/crm'
import { addActivity, deleteActivity, getConversation } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

// Carga una entrada del historial (llamada, WhatsApp, visita, presupuesto, nota).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const body = await readBody(request)
  if (!UUID_RE.test(params.id) || !body) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  if (!isManualActivityKind(body.kind)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
  }
  if (body.body !== undefined && body.body !== null && typeof body.body !== 'string') {
    return NextResponse.json({ error: 'Texto inválido.' }, { status: 400 })
  }

  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 4000) || null : null
  if (body.kind === 'nota' && !text) {
    return NextResponse.json({ error: 'La nota está vacía.' }, { status: 400 })
  }
  if (!(await getConversation(params.id, user))) {
    return NextResponse.json({ error: 'No se encontró ese contacto.' }, { status: 404 })
  }

  try {
    await addActivity(params.id, body.kind, text, user.id)
  } catch (error) {
    console.error('No se pudo guardar la actividad', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const body = await readBody(request)
  const activityId = body?.activityId
  if (!UUID_RE.test(params.id) || typeof activityId !== 'number' || !Number.isInteger(activityId)) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  if (!(await getConversation(params.id, user))) {
    return NextResponse.json({ error: 'No se encontró ese contacto.' }, { status: 404 })
  }

  try {
    await deleteActivity(params.id, activityId)
  } catch (error) {
    console.error('No se pudo borrar la actividad', error)
    return NextResponse.json({ error: 'Error al borrar.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
