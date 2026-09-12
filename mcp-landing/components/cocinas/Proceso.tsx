import { PROCESO } from './data'
import Reveal from './Reveal'
import { Eyebrow, Titulo } from './ui'

export default function Proceso() {
  return (
    <section id="proceso" className="bg-brand-cream px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <Eyebrow centrado>Cómo trabajamos</Eyebrow>
            <Titulo
              centrado
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="De la foto de tu cocina"
              italica="a la cocina puesta."
            />
            <p className="mt-5 text-center text-[15px] leading-relaxed text-brand-muted">
              Seis pasos y ningún trámite. No necesitás saber nada de carpintería: de eso nos
              encargamos nosotros.
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESO.map((p, i) => (
            <Reveal key={p.titulo} delay={(i % 3) * 90}>
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
