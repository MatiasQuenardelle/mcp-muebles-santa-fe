'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import ChatCTAButton from './ChatCTAButton'

export default function ProyectoCTA() {
  const { href: whatsAppHref, handleClick: trackWhatsApp } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, leí la guía de Proyecto Cocina y quiero avanzar con mi presupuesto.',
    ctaLabel: 'Prefiero escribir directo por WhatsApp',
    placement: 'proyecto_final_cta_directo',
  })

  return (
    <section className="bg-brand-dark text-white py-20 md:py-28 px-5 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl" />

      <div className="relative max-w-xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Siguiente paso
          </span>
          <div className="w-8 h-px bg-brand-gold" />
        </div>

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-6">
          &iquest;Empezamos?
        </h2>
        <p className="text-brand-muted-dark mb-8 leading-relaxed">
          Contale a nuestro asistente qu&eacute; necesit&aacute;s y ten&eacute; una
          estimaci&oacute;n al instante. Si te cierra, segu&iacute;s directo con
          Marcelo por WhatsApp. Sin formularios, sin esperas.
        </p>

        <div className="max-w-sm mx-auto mb-4">
          <ChatCTAButton
            text="Cotizar mi cocina ahora"
            pulse
            size="small"
            source="final"
            placement="proyecto_final_cta"
          />
        </div>
        <a
          href={whatsAppHref}
          onClick={trackWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-brand-muted-dark underline underline-offset-4 hover:text-white transition-colors mb-6"
        >
          Prefiero escribir directo por WhatsApp
        </a>
        <p className="text-sm text-brand-muted-dark">
          Respondemos en minutos &middot; Agenda de instalaci&oacute;n limitada para este mes
        </p>
      </div>
    </section>
  )
}
