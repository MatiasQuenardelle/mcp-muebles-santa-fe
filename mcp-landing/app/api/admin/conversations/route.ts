import { NextResponse } from 'next/server'
import { InputError, parseEditableFields } from '@/lib/adminInput'
import { requireAdmin } from '@/lib/session'
import { isConversationStatus } from '@/lib/crm'
import { createManualLead } from '@/lib/db'

// Alta manual: contactos que llegaron por fuera del chat de la web.
export async function POST(request: Request) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let input: Record<string, unknown>
  try {
    input = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  let fields: ReturnType<typeof parseEditableFields>
  try {
    fields = parseEditableFields(input)
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }

  if (!fields.name) {
    return NextResponse.json({ error: 'Poné al menos el nombre.' }, { status: 400 })
  }
  if (!fields.source || fields.source === 'chat') {
    return NextResponse.json({ error: 'Elegí por dónde llegó.' }, { status: 400 })
  }
  const status = input.status === undefined ? 'nuevo' : input.status
  if (!isConversationStatus(status)) {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
  }
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 4000) || null : null

  try {
    const id = await createManualLead({
      source: fields.source,
      name: fields.name,
      phone: fields.phone ?? null,
      email: fields.email ?? null,
      zona: fields.zona ?? null,
      project: fields.project ?? null,
      amount: fields.amount ?? null,
      status,
      follow_up_on: fields.follow_up_on ?? null,
      note,
      userId: user.id,
    })
    return NextResponse.json({ ok: true, id })
  } catch (error) {
    console.error('No se pudo crear el contacto', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
