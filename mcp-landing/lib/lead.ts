import type { Attribution } from '@/lib/attribution'

export interface LeadPayload {
  name?: string
  phone?: string
  message?: string
  source: string
  page: string
  attribution: Attribution | null
  transcript?: { role: string; content: string }[]
}

// Detecta un número de teléfono plausible en el texto del usuario.
export function detectPhone(text: string): string | null {
  const match = text.match(/(\+?\d[\d().\s-]{7,}\d)/)
  if (!match) {
    return null
  }
  const digits = match[0].replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 13) {
    return null
  }
  return match[0].trim()
}

// Envío best-effort del lead al backend. No bloquea la UX si falla.
export async function postLead(payload: LeadPayload): Promise<void> {
  try {
    await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // silencioso: la conversión ya se mide por GA aunque el webhook falle
  }
}

export function trackChatbotLead(payload: {
  placement: string
  attribution: Attribution | null
}) {
  if (typeof window === 'undefined') {
    return
  }

  const leadPayload = {
    lead_type: 'chatbot',
    placement: payload.placement,
    lead_source: payload.attribution?.source ?? '(direct)',
    lead_medium: payload.attribution?.medium ?? '(none)',
    lead_campaign: payload.attribution?.campaign ?? '',
    gclid: payload.attribution?.gclid ?? '',
  }

  window.dataLayer?.push({
    event: 'generate_lead',
    ...leadPayload,
  })

  window.gtag?.('event', 'generate_lead', leadPayload)
}
