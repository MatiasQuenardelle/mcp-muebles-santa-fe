import { NextResponse } from 'next/server'
import { cambiarEtapa, parseEtapa } from '@/lib/gestion/obras'
import { requireAdmin } from '@/lib/session'
import { idDeObra, respuestaDeError } from '../../respuestas'

// Lo único que un empleado puede escribir en una obra.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    await cambiarEtapa(idDeObra(params.id), parseEtapa(cuerpo), user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return respuestaDeError(error, 'No se pudo cambiar la etapa')
  }
}
