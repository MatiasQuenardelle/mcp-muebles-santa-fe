import { TRABAJOS } from './data'
import Reveal from './Reveal'
import { Eyebrow, Titulo } from './ui'

export default function Trabajos() {
  return (
    <section id="trabajos" className="bg-brand-sand px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Trabajos entregados</Eyebrow>
            <Titulo
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Cocinas reales, en casas"
              italica="reales de Santa Fe."
            />
            <p className="mt-5 text-[15px] leading-relaxed text-brand-muted">
              Ninguna de estas fotos es un render. Son cocinas que fabricamos, colocamos y
              dejamos funcionando, fotografiadas el día que terminamos.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRABAJOS.map((t, i) => (
            <Reveal
              key={t.src}
              delay={(i % 3) * 90}
              className={`flex ${t.destacado ? 'sm:col-span-2' : ''}`}
            >
              <figure className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-brand-border bg-white">
                <div
                  className={`overflow-hidden bg-brand-card ${
                    t.destacado ? 'aspect-[16/9]' : 'aspect-[4/3]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.src}
                    alt={t.titulo}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
                <figcaption
                  className={`min-w-0 p-5 sm:p-6 ${t.destacado ? 'sm:flex sm:items-baseline sm:gap-8' : ''}`}
                >
                  <h3
                    className={`font-display font-semibold text-brand-dark ${
                      t.destacado
                        ? 'text-[22px] sm:flex-shrink-0 sm:basis-[34%]'
                        : 'text-[19px]'
                    }`}
                  >
                    {t.titulo}
                  </h3>
                  <p
                    className={`text-[13px] leading-relaxed text-brand-muted ${
                      t.destacado ? 'mt-2 min-w-0 sm:mt-0' : 'mt-2'
                    }`}
                  >
                    {t.texto}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
