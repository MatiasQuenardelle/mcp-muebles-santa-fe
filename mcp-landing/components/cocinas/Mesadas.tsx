'use client'

import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import Reveal from './Reveal'
import { BotonFantasma, Check, Eyebrow, IconoWhatsApp, Titulo } from './ui'

const granito = [
  'Corte y vaciado a medida',
  'Cantos pulidos a máquina',
  'Sellado profesional incluido',
  'Integración perfecta al mueble',
]

const sintetico = [
  'Amplio catálogo de colores',
  'Sin juntas visibles',
  'Superficie compacta, fácil de limpiar',
  'Con o sin colocación',
]

// Muestrario orientativo: el catálogo real lo pasa Marcelo al día por WhatsApp.
const tonos = ['#F4F2ED', '#DCD6C8', '#BDBBB6', '#8A8A88', '#4B4B4C', '#23231F']

export default function Mesadas() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: 'Hola Marcelo, quiero consultar por una mesada. ¿Me pasás precio?',
    ctaLabel: 'Consultar mesadas',
    placement: 'cocinas_mesadas',
  })

  return (
    <section id="mesadas" className="relative bg-brand-dark px-5 py-20 md:py-28">
      <div className="cc-trama absolute inset-0" />

      <div className="relative mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow tono="oscuro">Mesadas</Eyebrow>
            <Titulo
              tono="oscuro"
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Granito natural o sintético."
              italica="Las dos son buenas."
            />
            <p className="mt-5 text-[15px] leading-relaxed text-white/60">
              La mesada es el módulo que más se toca y el que más se mira. Las dos opciones van
              con colocación profesional y sellado con siliconas de primera calidad.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal className="flex">
            <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
              <div className="aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cocinas/m-granito.jpg"
                  alt="Placa de granito natural cortada a medida"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 p-6 sm:p-8">
                <span className="text-[10.5px] uppercase tracking-[0.18em] text-brand-gold">
                  Piedra real de montaña
                </span>
                <h3 className="mt-2 font-display text-[25px] font-semibold text-white">
                  Granito natural
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/60">
                  Cada placa es única: no hay dos vetas iguales. Resiste el calor de la olla
                  recién sacada del fuego, los rayones y el paso del tiempo.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {granito.map((g) => (
                    <li key={g} className="flex gap-2.5 text-[13px] text-white/75">
                      <Check tono="oscuro" />
                      <span className="min-w-0">{g}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 overflow-hidden rounded border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/cocinas/m-perla.jpg"
                    alt="Textura del granito Gris Perla"
                    className="h-16 w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Gris Perla · uno de los granitos más pedidos
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal delay={90} className="flex">
            <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02]">
              <div className="flex h-[190px] sm:h-[220px]">
                {tonos.map((t) => (
                  <span
                    key={t}
                    className="flex-1 transition-transform duration-500 hover:scale-y-105"
                    style={{ backgroundColor: t }}
                  />
                ))}
              </div>

              <div className="min-w-0 p-6 sm:p-8">
                <span className="text-[10.5px] uppercase tracking-[0.18em] text-brand-gold">
                  Más opciones, mismo nivel
                </span>
                <h3 className="mt-2 font-display text-[25px] font-semibold text-white">
                  Sintético premium
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/60">
                  Superficie compacta con variedad de colores y modelos, incluidos los blancos
                  y grises lisos que el granito no da. Sin juntas visibles y muy fácil de
                  limpiar.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {sintetico.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[13px] text-white/75">
                      <Check tono="oscuro" />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Del blanco puro al grafito
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/50">
                    Los colores y modelos disponibles cambian según el stock del proveedor,
                    así que el catálogo lo pasamos al día por WhatsApp.
                  </p>
                  <BotonFantasma
                    href={href}
                    onClick={handleClick}
                    target="_blank"
                    className="mt-5 w-full sm:w-auto"
                  >
                    <IconoWhatsApp />
                    Ver colores y precios
                  </BotonFantasma>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
