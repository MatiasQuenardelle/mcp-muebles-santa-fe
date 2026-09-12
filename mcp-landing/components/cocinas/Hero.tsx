'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { BotonFantasma, BotonOro, IconoWhatsApp } from './ui'

const señales = [
  '+20 años fabricando',
  '481 cocinas entregadas',
  'Garantía escrita 12 meses',
  '15 a 20 días hábiles',
]

export default function Hero() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, vi la página de cocinas a medida y quiero pedir un presupuesto.',
    ctaLabel: 'Escribinos por WhatsApp',
    placement: 'cocinas_hero',
  })

  return (
    <section className="relative isolate flex min-h-[580px] items-center overflow-hidden bg-brand-ink md:min-h-[680px] lg:min-h-[740px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cocinas/hero.jpg"
        alt="Cocina a medida fabricada por MCP en Santa Fe: bajo mesada grafito y alacenas en símil madera"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="cc-hero-velo absolute inset-0" />

      <div className="relative mx-auto w-full max-w-[1180px] px-5 py-20 md:py-24">
        <nav aria-label="Ruta" className="mb-7 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <a href="/" className="transition-colors hover:text-brand-gold">
            Inicio
          </a>
          <span className="mx-2 text-brand-gold/60">/</span>
          <span className="text-brand-gold">Cocinas a medida</span>
        </nav>

        <h1 className="max-w-[19ch] font-display text-[2.6rem] font-semibold leading-[1.06] tracking-[-0.02em] text-white sm:max-w-[24ch] sm:text-[3.4rem] lg:text-[4.1rem]">
          Cocinas a medida{' '}
          <span className="italic text-brand-gold">en Santa Fe</span>, con el precio a la vista.
        </h1>

        <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-white/70 md:text-base">
          Fabricamos y colocamos muebles de cocina y mesadas con las medidas exactas de tu
          espacio. Elegí la línea, armá tu cocina en la calculadora y mirá el número antes de
          escribirnos.
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
          <BotonOro href="#calculadora">Calcular mi cocina</BotonOro>
          <BotonFantasma href={href} onClick={handleClick} target="_blank">
            <IconoWhatsApp />
            Escribinos por WhatsApp
          </BotonFantasma>
        </div>
      </div>
    </section>
  )
}
