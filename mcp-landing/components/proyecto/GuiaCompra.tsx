import Image from 'next/image'

const steps = [
  {
    num: '1',
    title: 'Consulta',
    desc: 'Nos escribís por WhatsApp y nos contás qué necesitás.',
  },
  {
    num: '2',
    title: 'Medidas',
    desc: 'Coordinamos una visita o trabajamos con tus medidas por foto.',
  },
  {
    num: '3',
    title: 'Fabricación',
    desc: '15 a 20 días hábiles. Te avisamos cuando está listo.',
  },
  {
    num: '4',
    title: 'Colocación',
    desc: 'Nuestro equipo instala, nivela y deja todo funcionando.',
  },
]

const materiales = [
  {
    title: 'Precisión total',
    desc: 'Cada mueble se fabrica con tus medidas exactas. Sin espacios, sin rellenos.',
  },
  {
    title: 'Melamina Egger',
    desc: 'Tablero importado, el mismo que usan las mejores cocinas del mercado.',
  },
  {
    title: 'Herrajes Grupo Euro',
    desc: 'Correderas telescópicas de extensión total. Cierran suave, duran décadas.',
  },
  {
    title: 'Manijas de aluminio',
    desc: 'Perfil negro anodizado. Estética actual, minimalista y de buen peso.',
  },
  {
    title: 'Colocación incluida',
    desc: 'Instalamos, nivelamos y dejamos todo funcionando. Vos no movés nada.',
  },
  {
    title: 'Garantía',
    desc: '12 meses sobre herrajes y estructura. Si algo falla, lo resolvemos.',
  },
]

const mesadas = [
  {
    tag: 'Granito natural',
    title: 'Piedra real de montaña',
    desc: 'Cada mesada es única. Resistente al calor, a los rayones y al paso del tiempo.',
    items: [
      'Corte y vaciado a medida',
      'Cantos pulidos a máquina',
      'Sellado profesional incluido',
      'Integración perfecta al mueble',
    ],
    images: [
      { src: '/mesada-granito.png', alt: 'Muestra real de mesada de granito gris' },
      { src: '/granito-perla.png', alt: 'Muestra real de granito gris perla' },
    ],
  },
  {
    tag: 'Sintético premium',
    title: 'Más opciones, mismo nivel',
    desc: 'Variedad de colores y modelos. Superficie compacta, fácil de limpiar y de larga duración.',
    items: [
      'Amplio catálogo de colores',
      'Sin juntas visibles',
      'Mayor durabilidad',
      'Con o sin colocación',
    ],
    images: [] as { src: string; alt: string }[],
  },
]

const incluido = [
  'Fabricación a medida completa',
  'Melamina Egger + cantos termofusionados',
  'Correderas telescópicas Grupo Euro',
  'Manijas de aluminio negro',
  'Colocación profesional',
  'Ajuste final en obra',
  'Limpieza final del espacio',
]

const noIncluido = [
  'Mesada (se cotiza aparte)',
  'Electricidad y plomería',
  'Electrodomésticos',
  'Pintura o revestimientos de pared',
]

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-px bg-brand-gold" />
      <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">{text}</span>
    </div>
  )
}

export default function GuiaCompra() {
  return (
    <div id="guia">
      {/* Cómo trabajamos */}
      <section className="px-5 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Guía de compra · Cómo trabajamos" />
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
            4 pasos, sin complicaciones.
          </h2>
          <p className="text-brand-muted mb-14 max-w-lg">
            No necesit&aacute;s saber nada de carpinter&iacute;a. Nosotros nos encargamos de todo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
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

      {/* Materiales */}
      <section className="px-5 py-20 md:py-28 bg-brand-card/40">
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Materiales y terminaciones" />
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
            Fabricamos bien.<br />No prometemos de m&aacute;s.
          </h2>
          <p className="text-brand-muted mb-14 max-w-lg">
            Los mismos materiales en todas las l&iacute;neas: lo que cambia es el
            equipamiento y las terminaciones, no la calidad.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {materiales.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-brand-border p-6"
              >
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mesadas */}
      <section className="px-5 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Mesadas" />
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
            Granito o sint&eacute;tico.<br />Las dos opciones son buenas.
          </h2>
          <p className="text-brand-muted mb-14 max-w-lg">
            Colocaci&oacute;n profesional incluida en ambas. Sellado con siliconas de
            primera calidad.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mesadas.map((card) => (
              <div
                key={card.tag}
                className="bg-brand-dark text-white rounded-2xl p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(196,162,69,0.1)_0%,transparent_60%)]" />
                <div className="relative">
                  <span className="inline-flex items-center rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
                    {card.tag}
                  </span>
                  <h3 className="font-serif text-2xl mb-3">{card.title}</h3>
                  <p className="text-sm text-brand-muted-dark leading-relaxed mb-6">
                    {card.desc}
                  </p>
                  <ul className="space-y-2">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <span className="text-brand-gold">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {card.images.length > 0 ? (
                    <div className="mt-6">
                      <div className="grid grid-cols-2 gap-3">
                        {card.images.map((img) => (
                          <div
                            key={img.src}
                            className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/10"
                          >
                            <Image
                              src={img.src}
                              alt={img.alt}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-brand-muted-dark mt-2">
                        Muestras reales: granito gris y gris perla
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Incluye / No incluye */}
      <section className="px-5 py-20 md:py-28 bg-brand-card/40">
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Claridad ante todo" />
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
            Qu&eacute; incluye.<br />Qu&eacute; no incluye.
          </h2>
          <p className="text-brand-muted mb-14 max-w-lg">
            Sin letra chica, sin sorpresas al final.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-brand-border p-8">
              <h3 className="font-bold text-lg mb-5 text-green-700">✓ Incluido</h3>
              <ul className="space-y-3">
                {incluido.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-brand-muted pb-3 border-b border-brand-border last:border-0 last:pb-0"
                  >
                    <span className="text-green-600 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-brand-border p-8">
              <h3 className="font-bold text-lg mb-5 text-red-700">✗ No incluido</h3>
              <ul className="space-y-3">
                {noIncluido.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-brand-muted pb-3 border-b border-brand-border last:border-0 last:pb-0"
                  >
                    <span className="text-red-500 mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
