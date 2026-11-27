'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { BotonFantasma, BotonOro, IconoWhatsApp } from '@/components/cocinas/ui'

const señales = ['+20 años fabricando', 'De piso a techo', 'Interiores incluidos', 'Colocación propia']

export default function Hero() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: 'Hola Marcelo, vi la página de placares a medida y quiero pedir un presupuesto.',
    ctaLabel: 'Escribinos por WhatsApp',
    placement: 'placares_hero',
  })

  return (
    <section className="relative isolate overflow-hidden bg-brand-ink">
      <div className="cc-trama absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_0%,rgba(196,162,69,0.12)_0%,transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-[1180px] px-5 py-20 md:py-28">
        <nav aria-label="Ruta" className="mb-7 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <a href="/" className="transition-colors hover:text-brand-gold">
            Inicio
          </a>
          <span className="mx-2 text-brand-gold/60">/</span>
          <span className="text-brand-gold">Placares a medida</span>
        </nav>

        <h1 className="max-w-[19ch] font-display text-[2.6rem] font-semibold leading-[1.06] tracking-[-0.02em] text-white sm:max-w-[22ch] sm:text-[3.4rem] lg:text-[4.1rem]">
          Placares a medida <span className="italic text-brand-gold">en Santa Fe</span>, con el
          precio a la vista.
        </h1>

        <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-white/70 md:text-base">
          Fabricamos y colocamos placares de piso a techo con el interior pensado para lo que
          guardás. Poné el ancho en la calculadora y mirá cuánto sale antes de escribirnos.
        </p>

        <div className="mt-8 flex flex-wrap gap-x-2.5 gap-y-2">
          {señales.map((s) => (
            <span
              key={s}
              className="border border-white/20 bg-brand-ink/40 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.14em] text-white/75"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <BotonOro href="#calculadora">Calcular mi placard</BotonOro>
          <BotonFantasma href={href} onClick={handleClick} target="_blank">
            <IconoWhatsApp />
            Escribinos por WhatsApp
          </BotonFantasma>
        </div>
      </div>
    </section>
  )
}
