import { PREGUNTAS } from './data'
import Reveal from './Reveal'
import { Eyebrow, Titulo } from './ui'

export default function Preguntas() {
  return (
    <section id="preguntas" className="bg-brand-sand px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Dudas frecuentes</Eyebrow>
            <Titulo
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Las preguntas que siempre"
              italica="nos hacen, respondidas."
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
