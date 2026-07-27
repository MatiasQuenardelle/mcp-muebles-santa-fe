'use client'

import { useState } from 'react'
import { homeFaqs as faqs } from '@/lib/faqData'

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
