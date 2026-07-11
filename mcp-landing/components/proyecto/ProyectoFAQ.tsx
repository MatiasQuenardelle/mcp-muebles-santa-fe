'use client'

import { useState } from 'react'

const faqs = [
  {
    q: '¿Es caro?',
    a: 'El precio incluye fabricación, materiales de primera y colocación profesional. Si lo comparás con un mueble de línea que no entra bien, más los costos de adaptación, salís perdiendo. Acá pagás una vez y queda para siempre.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Entre 15 y 20 días hábiles desde que confirmás. Te avisamos en cada etapa. La colocación se hace en un solo día, sin que tengas que hacer nada.',
  },
  {
    q: '¿Los materiales son buenos de verdad?',
    a: 'Usamos melamina Egger importada, la misma que usan las cocinas de alta gama. Las correderas son Grupo Euro con cierre suave. No mezclamos materiales de calidad con herrajes baratos: todo tiene que durar.',
  },
  {
    q: '¿Y si mi espacio tiene formas raras?',
    a: 'Justamente para eso somos a medida. Techos inclinados, columnas, rincones irregulares: todo tiene solución. Antes de fabricar, hacemos el relevamiento detallado del espacio.',
  },
  {
    q: '¿Cómo es la forma de pago?',
    a: 'Trabajamos con pagos por etapas. Solo abonás los materiales para arrancar la producción. El resto se paga en cuotas acordadas durante el proceso. Sin financiación bancaria, trato directo.',
  },
  {
    q: '¿Cómo sé que van a cumplir?',
    a: 'Damos garantía escrita de 12 meses. Si algo falla, lo resolvemos nosotros sin que te cueste nada extra. Trabajamos así hace años y no nos podemos dar el lujo de hacer las cosas mal.',
  },
]

export default function ProyectoFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="px-5 py-20 md:py-28 bg-brand-card/40">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Dudas frecuentes
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-12">
          Las preguntas que siempre nos hacen.<br />Respondidas sin vueltas.
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-colors duration-200 bg-white ${
                open === i
                  ? 'border-brand-gold/40'
                  : 'border-brand-border hover:border-brand-gold/20'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors"
              >
                <span className="font-semibold pr-4 text-sm md:text-base">{faq.q}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                    open === i ? 'rotate-180 text-brand-gold' : 'text-brand-muted'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  open === i ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 text-sm text-brand-muted leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
