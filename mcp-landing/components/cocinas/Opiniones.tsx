import { OPINIONES } from './data'
import Reveal from './Reveal'
import { Estrellas, Eyebrow, Titulo } from './ui'

export default function Opiniones() {
  return (
    <section className="bg-brand-sand px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Lo que dicen los clientes</Eyebrow>
            <Titulo
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="481 cocinas hablan"
              italica="por nosotros."
            />
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {OPINIONES.map((o, i) => (
            <Reveal key={o.nombre} delay={i * 90} className="flex">
              <blockquote className="relative flex min-w-0 flex-1 flex-col rounded-lg border border-brand-border bg-white p-6 sm:p-7">
                <span
                  aria-hidden
                  className="absolute right-5 top-3 select-none font-display text-[54px] leading-none text-brand-gold/20"
                >
                  &ldquo;
                </span>
                <Estrellas />
                <p className="mt-4 flex-1 pr-6 font-display text-[15px] italic leading-relaxed text-brand-dark/80">
                  {o.texto}
                </p>
                <footer className="mt-6 flex items-center gap-3 border-t border-brand-border pt-5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-gold/15 font-display text-[14px] font-semibold text-brand-gold">
                    {o.nombre.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <cite className="block text-[13.5px] font-semibold not-italic text-brand-dark">
                      {o.nombre}
                    </cite>
                    <span className="block text-[12px] text-brand-muted">{o.lugar}</span>
                  </span>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
