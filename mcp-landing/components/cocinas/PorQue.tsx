import { DIFERENCIALES, INCLUYE, NO_INCLUYE } from './data'
import Reveal from './Reveal'
import { Check, Cruz, Eyebrow, Titulo } from './ui'

export default function PorQue() {
  return (
    <section className="relative bg-brand-ink px-5 py-20 md:py-28">
      <div className="cc-trama absolute inset-0" />

      <div className="relative mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow tono="oscuro">Por qué MCP</Eyebrow>
            <Titulo
              tono="oscuro"
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Fabricamos bien."
              italica="No prometemos de más."
            />
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {DIFERENCIALES.map((d, i) => (
            <Reveal key={d.titulo} delay={(i % 3) * 80}>
              <div className="min-w-0 border-t border-white/10 pt-6">
                <h3 className="font-display text-[20px] font-semibold text-white">{d.titulo}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/55">{d.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Incluye / no incluye */}
        <Reveal>
          <div className="mt-16 grid grid-cols-1 overflow-hidden rounded-lg border border-white/10 md:grid-cols-2">
            <div className="min-w-0 bg-white p-6 sm:p-9">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
                Está incluido
              </span>
              <h3 className="mt-3 font-display text-[24px] font-semibold text-brand-dark">
                Sin letra chica.
              </h3>
              <ul className="mt-6 space-y-3">
                {INCLUYE.map((i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-brand-dark/85">
                    <Check />
                    <span className="min-w-0">{i}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 border-t border-brand-border bg-brand-card p-6 sm:p-9 md:border-l md:border-t-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                No está incluido
              </span>
              <h3 className="mt-3 font-display text-[24px] font-semibold text-brand-dark">
                Y te lo decimos antes.
              </h3>
              <ul className="mt-6 space-y-3">
                {NO_INCLUYE.map((i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-brand-muted">
                    <Cruz />
                    <span className="min-w-0">{i}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-[12.5px] leading-relaxed text-brand-muted">
                Si algo de esto te falta resolver, decinos y te recomendamos con quién. No
                cobramos por eso.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
