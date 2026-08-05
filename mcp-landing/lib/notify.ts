// Server-only: avisos al dueño cuando entra un lead.
// Todo es opcional: sin las variables de entorno cada función es un no-op y el
// resto del sitio funciona igual.

import type { Attribution } from '@/lib/attribution'
import { getOriginLabel } from '@/lib/attribution'
import type { ContactCard } from '@/lib/crm'
import { SITE_URL } from '@/lib/constants'
import { claimHotNotification, isDatabaseConfigured, releaseHotNotification } from '@/lib/db'

/**
 * Manda un mensaje de texto plano al chat de Telegram configurado.
 * Sin `parse_mode` a propósito: el mensaje incluye texto escrito por el
 * visitante y cualquier `_` o `*` suelto haría fallar el parseo de Markdown.
 */
async function sendTelegram(text: string): Promise<boolean> {
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim()
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? '').trim()
  if (!token || !chatId) {
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    })
    if (!response.ok) {
      throw new Error(`telegram ${response.status}: ${await response.text()}`)
    }
    return true
  } catch (error) {
    console.error('No se pudo mandar el aviso por Telegram', error)
    return false
  }
}

/**
 * Aviso instantáneo cuando el visitante deja su teléfono en el chat. Es el único
 * lead que el dueño no ve por ningún otro lado: los clics a WhatsApp le llegan
 * como mensaje real, y la tarjeta caliente se genera recién cuando alguien abre
 * el panel.
 */
export async function notifyPhoneLead(input: {
  conversationId: string | null
  name: string | null
  phone: string | null
  message: string | null
  page: string | null
  attribution: unknown
}): Promise<void> {
  // El claim hace de lock: un solo aviso por conversación, aunque el visitante
  // recargue y el widget vuelva a postear el lead. Sin conversación (o sin base)
  // no hay nada contra qué deduplicar, así que se manda igual.
  const claimable = isDatabaseConfigured() ? input.conversationId : null
  if (claimable && !(await claimHotNotification(claimable))) {
    return
  }

  const link = input.conversationId
    ? `${SITE_URL}/admin/c/${input.conversationId}`
    : `${SITE_URL}/admin`

  const text = [
    '📞 Dejaron un teléfono en el chat de la web',
    input.name ? `Nombre: ${input.name}` : null,
    input.phone ? `Teléfono: ${input.phone}` : null,
    `Origen: ${getOriginLabel((input.attribution as Attribution | null) ?? null)}`,
    input.page ? `Página: ${input.page}` : null,
    input.message ? `\n"${input.message}"` : null,
    `\n${link}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  if (!(await sendTelegram(text)) && claimable) {
    // Falló el envío: soltar el claim para poder reintentar.
    await releaseHotNotification(claimable).catch(() => {})
  }
}

export async function notifyHotLead(conversationId: string, card: ContactCard): Promise<void> {
  const webhook = (process.env.LEAD_WEBHOOK_URL ?? '').trim()
  if (!webhook || card.temperatura !== 'caliente') {
    return
  }

  // Antes de mandar: si otro tick ya avisó —o si ya se avisó del teléfono por
  // Telegram, que sería el mismo lead contado dos veces— cortamos acá.
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
