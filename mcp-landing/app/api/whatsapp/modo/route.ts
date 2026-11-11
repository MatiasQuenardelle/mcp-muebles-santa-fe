import { NextResponse } from 'next/server'
import { leerConfig, overrideDeTelefono } from '@/lib/whatsapp/db'
import { modoEfectivo } from '@/lib/whatsapp/modo'
import { iguales, soloDigitos } from '@/lib/whatsapp/webhook'

export const dynamic = 'force-dynamic'

// La función del workflow de Kapso pregunta acá antes de contestar a un cliente.
export async function POST(request: Request) {
  const secreto = (process.env.KAPSO_WEBHOOK_SECRET ?? '').trim()
  const recibido = request.headers.get('x-kapso-workflow-secret') ?? ''
  if (!secreto || !iguales(secreto, recibido)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { phone?: unknown } | null
  const phone = typeof body?.phone === 'string' ? soloDigitos(body.phone) : undefined
  if (!phone) {
    return NextResponse.json({ error: 'Falta el teléfono.' }, { status: 400 })
  }

  const [config, override] = await Promise.all([leerConfig(), overrideDeTelefono(phone)])
  return NextResponse.json({ mode: modoEfectivo(config.mode, override) })
}
