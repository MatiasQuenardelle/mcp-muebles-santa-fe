'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { BotonFantasma, BotonOro, IconoWhatsApp, Titulo } from '@/components/cocinas/ui'

const enlaces = [
  { href: '#calculadora', texto: 'Calculadora' },
  { href: '#incluye', texto: 'Qué incluye' },
  { href: '#proceso', texto: 'Proceso' },
  { href: '#preguntas', texto: 'Preguntas' },
  { href: '/cocinas', texto: 'Cocinas' },
]

export function Nav() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: 'Hola Marcelo, estoy viendo la página de placares y quiero pedir un presupuesto.',
    ctaLabel: 'Pedir presupuesto',
    placement: 'placares_nav',
  })

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-ink/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5">
        <a href="/" className="flex flex-shrink-0 items-center gap-3" aria-label="MCP Muebles a Medida">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="MCP Muebles a Medida" className="h-9 w-auto rounded-sm" />
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-brand-muted-dark xl:inline">
            Muebles a medida · Santa Fe
          </span>
        </a>
        <div className="hidden min-w-0 items-center gap-5 lg:flex">
          {enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.1em] text-white/70 transition-colors hover:text-brand-gold"
            >
              {e.texto}
            </a>
          ))}
        </div>
        <a
          href={href}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-shrink-0 items-center gap-2 rounded-md bg-brand-gold px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-brand-dark transition-all hover:bg-brand-gold-light"
        >
          <IconoWhatsApp size={15} />
          <span className="hidden sm:inline">Presupuesto</span>
          <span className="sm:hidden">Escribir</span>
        </a>
      </nav>
    </header>
  )
}

export function Cierre() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, quiero pedir un presupuesto para un placard a medida. Te paso una foto y las medidas.',
    ctaLabel: 'Pedir presupuesto',
    placement: 'placares_cierre',
  })

  return (
    <section className="relative overflow-hidden bg-brand-ink px-5 py-20 md:py-28">
      <div className="cc-trama absolute inset-0" />
      <div className="relative mx-auto max-w-[720px] text-center">
        <Titulo
          tono="oscuro"
          centrado
          className="text-[2rem] md:text-[2.7rem]"
          recta="¿Arrancamos?"
          italica="Pedí tu presupuesto sin compromiso."
        />
        <p className="mx-auto mt-6 max-w-[52ch] text-[15px] leading-relaxed text-white/60">
          Mandanos una foto de la pared y las medidas que tengas. En el día te contestamos con un
          precio, sin formularios y sin vueltas.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <BotonOro href={href} onClick={handleClick} target="_blank">
            <IconoWhatsApp />
            Pedir presupuesto
          </BotonOro>
          <BotonFantasma href="#calculadora">Volver a la calculadora</BotonFantasma>
        </div>
        <p className="mt-7 text-[11px] uppercase tracking-[0.16em] text-white/35">
          Santa Fe Capital y alrededores
        </p>
      </div>
    </section>
  )
}
