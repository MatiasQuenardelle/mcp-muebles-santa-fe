'use client'

import { useState } from 'react'

const faqs = [
  {
    q: '\u00bfCu\u00e1nto sale una cocina a medida?',
    a: 'Depende del tama\u00f1o y los materiales. Nuestro combo llave en mano arranca desde $660.000 todo incluido (bajo mesada + mesada de granito + bacha Johnson instalada). Mandanos las medidas por WhatsApp y en el d\u00eda te damos un precio exacto.',
  },
  {
    q: '\u00bfCu\u00e1nto tarda la fabricaci\u00f3n e instalaci\u00f3n?',
    a: 'El proceso completo, desde la confirmaci\u00f3n hasta la instalaci\u00f3n, suele tomar entre 2 y 3 semanas. Depende de la complejidad del proyecto y la disponibilidad de turnos.',
  },
  {
    q: '\u00bfQu\u00e9 materiales usan?',
    a: 'Melamina de alta densidad l\u00ednea EGGER (la mejor del mercado), mesadas de granito natural cortadas a medida con z\u00f3calos, herrajes Grupo Euro con correderas telesc\u00f3picas, y bachas Johnson Z52.',
  },
  {
    q: '\u00bfC\u00f3mo es la forma de pago?',
    a: 'Trabajamos con pagos por etapas. Solo abon\u00e1s los materiales para arrancar la producci\u00f3n. El resto se paga en cuotas acordadas durante el proceso. Sin financiaci\u00f3n bancaria, trato directo.',
  },
  {
    q: '\u00bfHacen placards y otros muebles tambi\u00e9n?',
    a: 'S\u00ed, adem\u00e1s de cocinas fabricamos placards a medida, vestidores, muebles de ba\u00f1o y otros amoblamientos. Consult\u00e1 por WhatsApp y te asesoramos.',
  },
  {
    q: '\u00bfNecesito tener las medidas exactas?',
    a: 'No. Con medidas aproximadas y una foto de tu cocina actual alcanza para darte un presupuesto. Despu\u00e9s nosotros vamos a medir en obra sin costo.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="px-5 py-20 md:py-28">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Preguntas frecuentes
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-12">
          Todo lo que necesit&aacute;s<br />saber antes de escribirnos.
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-colors duration-200 ${
                open === i
                  ? 'border-brand-gold/40 bg-brand-card/50'
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
