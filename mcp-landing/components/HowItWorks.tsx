const steps = [
  {
    num: '1',
    title: 'Me escrib\u00eds',
    desc: 'Por WhatsApp, cont\u00e1ndome qu\u00e9 quer\u00e9s hacer y en qu\u00e9 espacio. Con una foto y medidas aproximadas alcanza.',
  },
  {
    num: '2',
    title: 'Medici\u00f3n en casa',
    desc: 'Coordinamos una visita. Tomo medidas y entiendo tu espacio en detalle. Sin costo.',
  },
  {
    num: '3',
    title: 'Dise\u00f1o + presupuesto',
    desc: 'Te entrego una propuesta clara con dise\u00f1o en 3D y precio definido. Sin letra chica.',
  },
  {
    num: '4',
    title: 'Fabricaci\u00f3n e instalaci\u00f3n',
    desc: 'Si avanzamos, se fabrica y se instala con equipo propio. En tiempo y forma.',
  },
]

export default function HowItWorks() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            C&oacute;mo funciona
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
          Cuatro pasos.<br />Sin vueltas.
        </h2>
        <p className="text-brand-muted mb-14 max-w-lg">
          Sin reuniones largas, sin esperas eternas, sin sorpresas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
          {/* Connecting line between step circles (desktop only) */}
          <div className="hidden md:block absolute top-[22px] left-[55px] right-[55px] h-px bg-gradient-to-r from-brand-gold/30 via-brand-gold/20 to-brand-gold/30" />

          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="w-11 h-11 bg-brand-dark text-white rounded-full flex items-center justify-center text-lg font-bold mb-4 ring-2 ring-brand-gold/30 ring-offset-2 ring-offset-brand-cream">
                {step.num}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
