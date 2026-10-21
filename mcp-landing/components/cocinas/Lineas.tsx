import { LINEAS, precioDesde } from './data'
import Reveal from './Reveal'
import { Check, Eyebrow, Titulo, formatearPesos } from './ui'

export default function Lineas() {
  return (
    <section id="lineas" className="bg-brand-cream px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Nuestras líneas</Eyebrow>
            <Titulo
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Tres líneas, una misma"
              italica="obsesión por la medida."
            />
            <p className="mt-5 text-[15px] leading-relaxed text-brand-muted">
              Lo que cambia entre las tres es el tablero y el servicio, no la prolijidad. Todas
              se fabrican con las medidas de tu pared en nuestro taller de Santa Fe.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {LINEAS.map((l, i) => (
            <Reveal key={l.id} delay={i * 90} className="flex">
              <article
                className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white ${
                  l.destacada
                    ? 'border-brand-gold shadow-[0_18px_46px_rgba(196,162,69,0.16)]'
                    : 'border-brand-border'
                }`}
              >
                <div
                  className={`py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] ${
                    l.destacada
                      ? 'bg-brand-gold text-brand-dark'
                      : 'bg-brand-card text-brand-muted'
                  }`}
                >
                  {l.destacada ? 'La más pedida' : l.claim}
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-display text-[30px] font-semibold leading-none text-brand-dark">
                    {l.nombre}
                  </h3>

                  <div className="mt-5">
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-brand-muted">
                      Bajo mesada 1.20 m desde
                    </span>
                    <p className="mt-1 font-display text-[2.3rem] leading-none tabular-nums text-brand-dark">
                      {formatearPesos(precioDesde(l.id))}
                    </p>
                  </div>

                  <p className="mt-5 text-[13.5px] leading-relaxed text-brand-muted">
                    {l.descripcion}
                  </p>

                  <dl className="mt-6 space-y-3 border-t border-brand-border pt-5 text-[12.5px]">
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-brand-muted">
                        Tablero
                      </dt>
                      <dd className="mt-0.5 font-medium text-brand-dark">{l.material}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-brand-muted">
                        Colocación
                      </dt>
                      <dd className="mt-0.5 font-medium text-brand-dark">{l.colocacion}</dd>
                    </div>
                  </dl>

                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-brand-border pt-5">
                    {l.incluye.map((item) => (
                      <li key={item} className="flex gap-2.5 text-[13px] text-brand-dark/80">
                        <Check />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#calculadora"
                    className="mt-7 block rounded-md border border-brand-dark/15 py-3 text-center text-[11.5px] font-bold uppercase tracking-[0.1em] text-brand-dark transition-all hover:border-brand-gold hover:bg-brand-gold hover:text-brand-dark"
                  >
                    Calcular con esta línea
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 max-w-[70ch] text-[13px] leading-relaxed text-brand-muted">
            La Económica y la Estándar son los mismos módulos y el mismo tablero. La
            diferencia es que en la Económica te entregamos los muebles y los colocás vos, y
            por eso el bajo mesada sale $50.000 menos por metro lineal.{' '}
            <a href="#calculadora" className="font-medium text-brand-gold underline decoration-brand-gold/40 underline-offset-4 hover:decoration-brand-gold">
              Comparalas en la calculadora
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  )
}
