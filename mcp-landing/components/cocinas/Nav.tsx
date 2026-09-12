'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { IconoWhatsApp } from './ui'

const enlaces = [
  { href: '#lineas', texto: 'Líneas' },
  { href: '#calculadora', texto: 'Calculadora' },
  { href: '#trabajos', texto: 'Trabajos' },
  { href: '#mesadas', texto: 'Mesadas' },
  { href: '#proceso', texto: 'Proceso' },
  { href: '#preguntas', texto: 'Preguntas' },
]

export default function Nav() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, estoy viendo la página de cocinas a medida y quiero pedir un presupuesto.',
    ctaLabel: 'Pedir presupuesto',
    placement: 'cocinas_nav',
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
