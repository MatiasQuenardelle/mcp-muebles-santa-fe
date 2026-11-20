'use client'

import { BASE_PRICE_LABEL } from '@/lib/constants'
import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'

export default function HeroPriceBadge() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, vi el combo desde $660.000 todo incluido y quiero consultar el precio para mi cocina.',
    ctaLabel: BASE_PRICE_LABEL,
    placement: 'hero_price_badge',
  })

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold transition-colors duration-200 hover:border-brand-gold/60 hover:bg-brand-gold/20"
    >
      {BASE_PRICE_LABEL}
    </a>
  )
}
