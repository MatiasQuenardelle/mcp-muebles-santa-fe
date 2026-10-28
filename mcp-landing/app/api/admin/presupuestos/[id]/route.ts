import { NextResponse } from 'next/server'
import { InputError, parsePresupuestoData } from '@/lib/adminInput'
import {
  addActivity,
  deletePresupuesto,
  getConversation,
  getPresupuesto,
  markPresupuestoSent,
  updateConversation,
  updatePresupuesto,
  type PresupuestoRow,
} from '@/lib/db'
import { calcular, pesos } from '@/lib/presupuesto'
import { requireAdmin, type AdminUser } from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// El presupuesto existe y su contacto es visible para este usuario.
async function findVisible(id: string, user: AdminUser): Promise<PresupuestoRow | null> {
  if (!UUID_RE.test(id)) {
    return null
  }
  const row = await getPresupuesto(id)
  return row && (await getConversation(row.conversation_id, user)) ? row : null
}

/**
 * Guarda los cambios del editor. Con `marcarEnviado` además lo deja en el
 * historial del contacto ("Presupuesto enviado", que lo pasa a presupuestado)
 * y copia el total al monto del contacto.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  const row = await findVisible(params.id, user)
  if (!row) {
    return NextResponse.json({ error: 'No se encontró ese presupuesto.' }, { status: 404 })
  }

  try {
    let total = row.total
    if (body.data !== undefined) {
      if (row.kind !== 'formal') {
        return NextResponse.json({ error: 'El preliminar no se edita.' }, { status: 400 })
      }
      const data = parsePresupuestoData(body.data)
      total = calcular(data).total
      await updatePresupuesto(row.id, data, total)
    }
    if (body.marcarEnviado === true && (await markPresupuestoSent(row.id))) {
      await updateConversation(row.conversation_id, { amount: total }, user.id)
      await addActivity(row.conversation_id, 'presupuesto', `N° ${row.numero} · ${pesos(total)}`, user.id)
    }
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('No se pudo guardar el presupuesto', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const row = await findVisible(params.id, user)
  if (!row) {
    return NextResponse.json({ error: 'No se encontró ese presupuesto.' }, { status: 404 })
  }
  try {
    await deletePresupuesto(row.id)
  } catch (error) {
    console.error('No se pudo borrar el presupuesto', error)
    return NextResponse.json({ error: 'Error al borrar.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
