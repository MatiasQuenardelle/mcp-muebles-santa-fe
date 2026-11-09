import { NextResponse } from 'next/server'
import { agregarAjuste, parseAjusteNuevo } from '@/lib/gestion/obras'
import { requireOwner } from '@/lib/session'
import { idDeObra, respuestaDeError } from '../../respuestas'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño ajusta un contrato.' }, { status: 403 })
  }
  const cuerpo = await request.json().catch(() => null)
  try {
    await agregarAjuste(idDeObra(params.id), parseAjusteNuevo(cuerpo), user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return respuestaDeError(error, 'No se pudo cargar el ajuste')
  }
}
