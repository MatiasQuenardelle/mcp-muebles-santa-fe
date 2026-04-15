import WhatsAppButton from './WhatsAppButton'

export default function Hero() {
  return (
    <section className="bg-brand-dark text-white relative overflow-hidden">
      {/* Subtle radial gradients for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(196,162,69,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(196,162,69,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-5 py-14 md:py-0 md:grid md:grid-cols-2 md:gap-12 md:items-center md:min-h-[85vh]">
        {/* Content */}
        <div className="md:py-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px bg-brand-gold" />
            <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
              MCP - Muebles a Medida &middot; Santa Fe
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.12] mb-6">
            Dise&ntilde;o y medici&oacute;n{' '}
            <em className="text-gradient-gold not-italic">profesional</em>{' '}
            de cocinas a medida
          </h1>

          <p className="text-brand-muted-dark text-lg leading-relaxed mb-8 max-w-lg">
            Te asesoro personalmente, tomo medidas en tu espacio y te entrego
            una propuesta lista para ejecutar. Sin vueltas.
          </p>

          <div className="hidden md:block max-w-sm mb-3">
            <WhatsAppButton text="Coordinar medici&oacute;n gratis" pulse />
          </div>
          <p className="hidden md:block text-sm text-brand-muted-dark">
            Presupuesto sin compromiso &middot; Respuesta en el d&iacute;a
          </p>
        </div>

        {/* Image */}
        <div className="mt-10 md:mt-0 md:py-12">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-brand-gold/20 via-transparent to-brand-gold/10 rounded-2xl blur-sm" />
            <img
              src="/cocina-moderna.png"
              alt="Cocina a medida fabricada por MCP - Muebles a Medida en Santa Fe"
              className="relative w-full rounded-2xl object-cover aspect-[4/3] ring-1 ring-white/10"
            />
            <div className="absolute bottom-4 left-4 bg-brand-dark/80 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-lg border border-white/10">
              Trabajo realizado en Santa Fe
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-3 text-center md:text-left md:flex md:gap-16">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-brand-gold">20+</div>
            <div className="text-xs md:text-sm text-brand-muted-dark">a&ntilde;os de<br className="md:hidden" /> experiencia</div>
          </div>
          <div className="border-x border-white/10 md:border-0">
            <div className="text-2xl md:text-3xl font-bold text-brand-gold">481</div>
            <div className="text-xs md:text-sm text-brand-muted-dark">cocinas<br className="md:hidden" /> instaladas</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-brand-gold">1 d&iacute;a</div>
            <div className="text-xs md:text-sm text-brand-muted-dark">respuesta<br className="md:hidden" /> garantizada</div>
          </div>
        </div>
      </div>
    </section>
  )
}
