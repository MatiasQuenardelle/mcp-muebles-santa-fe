import { NextResponse } from 'next/server'
import { parseUuid } from '@/lib/gestion/entrada'
import { marcarTarea } from '@/lib/gestion/equipo'
import { requireAdmin } from '@/lib/session'
import { responderError } from '../../../errores'

// Abierto a cualquier cuenta: quién puede marcar qué lo decide marcarTarea.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const cuerpo = (await request.json().catch(() => null)) as { hecha?: unknown } | null
  if (typeof cuerpo?.hecha !== 'boolean') {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  try {
    if (!(await marcarTarea(parseUuid(params.id, 'Tarea'), cuerpo.hecha, user))) {
      return NextResponse.json({ error: 'No se encontró esa tarea.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return responderError(error, 'marcar la tarea')
  }
}
