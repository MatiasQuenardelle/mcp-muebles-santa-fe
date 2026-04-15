import WhatsAppButton from './WhatsAppButton'

const items = [
  { text: 'Bajo mesada de melamina EGGER a medida', badge: 'EGGER' },
  { text: 'Mesada de granito natural cortada, pulida, con z\u00f3calos y colocaci\u00f3n' },
  { text: 'Bacha Johnson Z52 conectada y funcionando el mismo d\u00eda', badge: 'JOHNSON' },
  { text: 'Herrajes de primera l\u00ednea con correderas telesc\u00f3picas', badge: 'GRUPO EURO' },
  { text: 'Manijas tiradores de aluminio en distintos colores' },
  { text: 'Dise\u00f1o previo en 3D para que veas c\u00f3mo queda' },
  { text: 'Medici\u00f3n en obra incluida, sin costo adicional' },
  { text: 'Instalaci\u00f3n completa por equipo propio' },
]

export default function WhatIsIncluded() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="max-w-6xl mx-auto md:grid md:grid-cols-2 md:gap-16 md:items-center">
        {/* Content */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-brand-gold" />
            <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
              Lo que recib&iacute;s
            </span>
          </div>

          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-2">
            Todo incluido.<br />
            Bacha Johnson de regalo.
          </h2>
          <p className="text-brand-muted mb-8">
            Combo llave en mano: contrat&aacute;s la cocina y te entregamos todo instalado y funcionando.
          </p>

          <ul className="space-y-3 mb-8">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm leading-relaxed">
                  {item.text}
                  {item.badge && (
                    <span className="ml-2 text-[11px] font-bold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="bg-gradient-to-r from-brand-dark to-brand-dark/95 text-white rounded-xl py-5 px-7 mb-6 shadow-elevated relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-baseline gap-2">
              <span className="text-sm text-brand-muted-dark">desde</span>
              <span className="text-3xl md:text-4xl font-bold text-brand-gold">$660.000</span>
              <span className="text-sm text-brand-muted-dark">todo incluido</span>
            </div>
          </div>

          <div className="max-w-sm mb-3">
            <WhatsAppButton text="Consultar precio para mi medida" size="small" />
          </div>
          <p className="text-xs text-brand-muted mt-2">
            Estamos tomando proyectos para este mes. Los turnos se ocupan r&aacute;pido.
          </p>
        </div>

        {/* Photos */}
        <div className="mt-12 md:mt-0 grid grid-cols-2 gap-3">
          <div className="overflow-hidden rounded-xl col-span-2">
            <img
              src="/cocina-lineal.png"
              alt="Cocina lineal con muebles superiores y mesada de granito"
              className="object-cover aspect-[3/4] w-full hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="overflow-hidden rounded-xl">
            <img
              src="/granito-perla.png"
              alt="Granito gris perla para mesadas"
              className="object-cover aspect-square w-full hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="overflow-hidden rounded-xl">
            <img
              src="/mesada-granito.png"
              alt="Mesada de granito natural"
              className="object-cover aspect-square w-full hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
