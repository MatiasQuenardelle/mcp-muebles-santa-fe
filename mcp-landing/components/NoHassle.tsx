const yesItems = [
  'Quer\u00e9s hacerlo bien desde el inicio, no parcharlo despu\u00e9s',
  'Busc\u00e1s asesoramiento real, no solo una cotizaci\u00f3n',
  'Valor\u00e1s dise\u00f1o funcional y calidad de terminaci\u00f3n',
  'Ten\u00e9s o est\u00e1s por tener el espacio listo para medir',
]

const noItems = [
  'Solo quer\u00e9s pedir precios para comparar sin intenci\u00f3n real',
  'Todav\u00eda no tomaste ninguna decisi\u00f3n sobre el proyecto',
  'Busc\u00e1s el precio m\u00e1s bajo sin importar c\u00f3mo queda',
]

export default function NoHassle() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Antes de contactarme
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-12">
          &iquest;Este servicio<br />es para vos?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yes column */}
          <div className="border border-brand-gold/30 rounded-xl p-6 md:p-8 bg-brand-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="relative font-bold text-lg mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-gold/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              S&iacute; es para vos si...
            </h3>
            <ul className="space-y-4">
              {yesItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* No column */}
          <div className="border border-brand-border rounded-xl p-6 md:p-8">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-brand-muted">
              <div className="w-7 h-7 rounded-full bg-brand-border flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-muted" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              No es para vos si...
            </h3>
            <ul className="space-y-4">
              {noItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-brand-muted rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed text-brand-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
