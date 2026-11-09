import { NextResponse } from 'next/server'
import { entregarObra } from '@/lib/gestion/obras'
import { requireOwner } from '@/lib/session'
import { idDeObra, respuestaDeError } from '../../respuestas'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireOwner(request)
  if (!user) {
    return NextResponse.json({ error: 'Solo el dueño marca una obra como entregada.' }, { status: 403 })
  }
  try {
    await entregarObra(idDeObra(params.id), user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return respuestaDeError(error, 'No se pudo entregar la obra')
  }
}
