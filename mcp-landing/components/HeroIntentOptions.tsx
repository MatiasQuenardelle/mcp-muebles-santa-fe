'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'

const options = [
  {
    label: 'Tengo medidas',
    message:
      'Hola Marcelo, ya tengo las medidas aproximadas de mi cocina y quiero pedir un presupuesto.',
  },
  {
    label: 'Tengo una foto',
    message:
      'Hola Marcelo, tengo una foto de mi cocina y quiero que me orienten con un presupuesto.',
  },
  {
    label: 'Necesito medicion',
    message:
      'Hola Marcelo, necesito coordinar una visita para medir mi cocina y avanzar con un presupuesto.',
  },
]

function IntentLink({
  label,
  message,
}: {
  label: string
  message: string
}) {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: message,
    ctaLabel: label,
    placement: 'hero_intent',
  })

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:border-brand-gold/40 hover:bg-white/[0.06]"
    >
      {label}
    </a>
  )
}

export default function HeroIntentOptions() {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <IntentLink key={option.label} label={option.label} message={option.message} />
      ))}
    </div>
  )
}
