import Reveal from '@/components/cocinas/Reveal'
import { Check, Eyebrow, Titulo } from '@/components/cocinas/ui'
import { INCLUYE, PREGUNTAS, PROCESO } from './data'

export function Incluye() {
  return (
    <section id="incluye" className="bg-white px-5 py-20 md:py-28">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <Eyebrow>Qué incluye</Eyebrow>
          <Titulo
            className="mt-4 text-[2rem] md:text-[2.6rem]"
            recta="Un placard completo,"
            italica="no una caja con puertas."
          />
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-brand-muted">
            El precio de la calculadora ya trae el interior armado. Lo diseñamos para lo que vas a
            guardar y lo dejamos colocado.
          </p>
        </Reveal>
        <Reveal delay={90}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INCLUYE.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-lg border border-brand-border bg-brand-cream/50 p-4 text-[14px] leading-snug text-brand-dark"
              >
                <Check />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

export function Proceso() {
  return (
    <section id="proceso" className="bg-brand-sand px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <Eyebrow centrado>Cómo trabajamos</Eyebrow>
            <Titulo
              centrado
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="De una foto de la pared"
              italica="al placard colocado."
            />
          </div>
        </Reveal>
        <ol className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
          {PROCESO.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 90}>
              <li className="min-w-0 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-gold font-display text-[17px] font-semibold text-brand-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 font-display text-[20px] font-semibold text-brand-dark">
                  {p.titulo}
                </h3>
                <p className="mx-auto mt-2.5 max-w-[38ch] text-[13.5px] leading-relaxed text-brand-muted">
                  {p.texto}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Preguntas() {
  return (
    <section id="preguntas" className="bg-brand-cream px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Dudas frecuentes</Eyebrow>
            <Titulo
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Lo que siempre nos preguntan"
              italica="sobre placares."
            />
          </div>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {PREGUNTAS.map((p, i) => (
            <Reveal key={p.q} delay={(i % 2) * 80} className="flex">
              <div className="min-w-0 flex-1 rounded-lg border border-brand-border bg-white p-6">
                <h3 className="font-display text-[17px] font-semibold leading-snug text-brand-dark">
                  {p.q}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-brand-muted">{p.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
