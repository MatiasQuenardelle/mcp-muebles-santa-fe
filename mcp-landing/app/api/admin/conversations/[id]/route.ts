import { NextResponse } from 'next/server'
import { InputError, parseEditableFields } from '@/lib/adminInput'
import { getUser, requireAdmin, requireOwner } from '@/lib/session'
import { generateCard } from '@/lib/card'
import { isConversationStatus, type ConversationStatus } from '@/lib/crm'
import {
  assignConversation,
  deleteConversation,
  getConversation,
  getMessages,
  markConversationRead,
  saveCard,
  updateConversation,
} from '@/lib/db'
import { notifyHotLead } from '@/lib/notify'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  // Un contacto de otro responsable para un usuario común es como si no existiera.
  const conversation = await getConversation(params.id, user)
  if (!conversation) {
    return NextResponse.json({ error: 'No se encontró ese contacto.' }, { status: 404 })
  }

  const input = body as Record<string, unknown>

  // Responsable. El dueño asigna a cualquiera; un usuario solo toma uno sin
  // asignar o suelta uno suyo (getConversation ya garantizó que es una de esas dos).
  let assignee: string | null | undefined
  if (input.assignedTo !== undefined) {
    if (input.assignedTo !== null && (typeof input.assignedTo !== 'string' || !UUID_RE.test(input.assignedTo))) {
      return NextResponse.json({ error: 'Responsable inválido.' }, { status: 400 })
    }
    assignee = input.assignedTo
    if (user.role !== 'owner' && assignee !== null && assignee !== user.id) {
      return NextResponse.json({ error: 'Solo el dueño reparte contactos.' }, { status: 403 })
    }
    if (assignee !== null && !(await getUser(assignee))?.active) {
      return NextResponse.json({ error: 'Ese usuario no está activo.' }, { status: 400 })
    }
  }
  let fields: ReturnType<typeof parseEditableFields> & { status?: ConversationStatus }
  try {
    fields = parseEditableFields(input)
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }

  if (input.status !== undefined) {
    if (!isConversationStatus(input.status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
    }
    fields.status = input.status
  }

  try {
    if (Object.keys(fields).length > 0) {
      await updateConversation(params.id, fields, user.id)
    }
    if (assignee !== undefined) {
      await assignConversation(params.id, assignee, user.id)
    }
    // Lo manda MarkRead al abrir la conversación en el panel.
    if (input.read === true) {
      await markConversationRead(params.id)
    }
    // Regeneración a pedido desde el detalle. Se hace acá y no encolándola: la
    // cola solo toma charlas quietas hace 20 minutos, así que una conversación
    // recién terminada nunca se regeneraría. Una sola tarjeta son ~2s, entra
    // holgada en el timeout de 10s de Vercel Hobby.
    if (input.regenerateCard === true) {
      const messages = await getMessages(params.id)
      const card = await generateCard(messages)
      if (!card) {
        return NextResponse.json({ error: 'No se pudo generar el resumen.' }, { status: 502 })
      }
      await saveCard(params.id, card, messages.length)
      await notifyHotLead(params.id, card)
    }
  } catch (error) {
    console.error('No se pudo actualizar la conversación', error)
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Borrar es irreversible y se lleva todo el historial: solo el dueño.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireOwner(request))) {
    return NextResponse.json({ error: 'Solo el dueño puede borrar contactos.' }, { status: 403 })
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 })
  }

  try {
    await deleteConversation(params.id)
  } catch (error) {
    console.error('No se pudo borrar la conversación', error)
    return NextResponse.json({ error: 'Error al borrar.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
