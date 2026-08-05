// Server-only: aviso al dueño cuando el extractor marca un lead como caliente.
// Sin LEAD_WEBHOOK_URL no hace nada, así que el panel funciona igual sin config.

import type { ContactCard } from '@/lib/crm'
import { SITE_URL } from '@/lib/constants'
import { claimHotNotification, releaseHotNotification } from '@/lib/db'

export async function notifyHotLead(conversationId: string, card: ContactCard): Promise<void> {
  const webhook = (process.env.LEAD_WEBHOOK_URL ?? '').trim()
  if (!webhook || card.temperatura !== 'caliente') {
    return
  }

  // Antes de mandar: si otro tick ya avisó, esto devuelve false y cortamos.
  if (!(await claimHotNotification(conversationId))) {
    return
  }

  const text = [
    '🔥 Lead caliente en la web',
    card.nombre ? `Nombre: ${card.nombre}` : null,
    card.telefono ? `Teléfono: ${card.telefono}` : null,
    card.tipo_proyecto ? `Proyecto: ${card.tipo_proyecto}` : null,
    '',
    card.resumen,
    card.proximo_paso ? `\nPróximo paso: ${card.proximo_paso}` : null,
    `\n${SITE_URL}/admin/c/${conversationId}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hot_lead',
        conversationId,
        url: `${SITE_URL}/admin/c/${conversationId}`,
        // `text` para webhooks que esperan un mensaje ya armado (Slack, Zapier,
        // Make → WhatsApp); `card` para los que quieran los campos sueltos.
        text,
        card,
      }),
    })
    if (!response.ok) {
      throw new Error(`webhook ${response.status}`)
    }
  } catch (error) {
    console.error('No se pudo avisar del lead caliente', conversationId, error)
    await releaseHotNotification(conversationId).catch(() => {})
  }
}
