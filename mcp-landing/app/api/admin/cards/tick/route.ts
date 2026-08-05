import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateCard } from '@/lib/card'
import {
  claimConversationsForCard,
  countPendingCards,
  getMessages,
  isDatabaseConfigured,
  releaseCardClaim,
  saveCard,
} from '@/lib/db'
import { notifyHotLead } from '@/lib/notify'

// Pocas por request: el timeout de una función de Vercel en Hobby es 10s y cada
// tarjeta tarda ~2s. El cliente vuelve a llamar mientras queden pendientes.
const BATCH_SIZE = 3

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ generated: 0, remaining: 0 })
  }

  let ids: string[] = []
  try {
    ids = await claimConversationsForCard(BATCH_SIZE)
  } catch (error) {
    console.error('No se pudieron reclamar conversaciones', error)
    return NextResponse.json({ error: 'Error al leer la base.' }, { status: 500 })
  }

  let generated = 0
  for (const id of ids) {
    try {
      const messages = await getMessages(id)
      const card = await generateCard(messages)
      if (card) {
        await saveCard(id, card, messages.length)
        await notifyHotLead(id, card)
        generated += 1
      } else {
        await releaseCardClaim(id)
      }
    } catch (error) {
      console.error('No se pudo generar la tarjeta', id, error)
      // Se libera el lock para que el próximo tick lo reintente.
      await releaseCardClaim(id).catch(() => {})
    }
  }

  const remaining = await countPendingCards().catch(() => 0)
  return NextResponse.json({ generated, remaining })
}
