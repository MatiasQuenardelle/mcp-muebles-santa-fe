'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { BotonFantasma, BotonOro, IconoWhatsApp, Titulo } from './ui'

export default function Cierre() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, quiero pedir un presupuesto para mi cocina a medida. Te paso una foto y las medidas.',
    ctaLabel: 'Pedir presupuesto',
    placement: 'cocinas_cierre',
  })

  return (
    <section className="relative overflow-hidden bg-brand-ink px-5 py-20 md:py-28">
      <div className="cc-trama absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(196,162,69,0.10)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-[720px] text-center">
        <Titulo
          tono="oscuro"
          centrado
          className="text-[2rem] md:text-[2.7rem]"
          recta="¿Arrancamos?"
          italica="Pedí tu presupuesto sin compromiso."
        />
        <p className="mx-auto mt-6 max-w-[52ch] text-[15px] leading-relaxed text-white/60">
          Mandanos una foto de tu cocina y las medidas que tengas. En el día te contestamos con
          un precio. Sin formularios, sin esperas y sin que te llame nadie que no sea Marcelo.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <BotonOro href={href} onClick={handleClick} target="_blank">
            <IconoWhatsApp />
            Pedir presupuesto
          </BotonOro>
          <BotonFantasma href="#calculadora">Volver a la calculadora</BotonFantasma>
        </div>

        <p className="mt-7 text-[11px] uppercase tracking-[0.16em] text-white/35">
          Santa Fe Capital y alrededores · Respondemos en minutos
        </p>
      </div>
    </section>
  )
}
