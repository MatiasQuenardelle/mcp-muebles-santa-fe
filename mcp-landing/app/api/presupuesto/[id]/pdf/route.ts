import { NextResponse } from 'next/server'
import { presupuestoPdfResponse } from '@/components/pdf/render'
import { getPresupuesto, isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// El id (un uuid) es el permiso: lo conoce solo quien generó el preliminar.
// Nunca sirve un presupuesto formal, que tiene los costos internos.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const row =
    isDatabaseConfigured() && UUID_RE.test(params.id) ? await getPresupuesto(params.id) : null
  if (!row || row.kind !== 'preliminar') {
    return NextResponse.json({ error: 'No se encontró.' }, { status: 404 })
  }
  // inline: los navegadores internos de Instagram y WhatsApp lo muestran en vez
  // de intentar una descarga que no soportan.
  return presupuestoPdfResponse(row, 'inline')
}
