import WhatsAppButton from './WhatsAppButton'

export default function FinalCTA() {
  return (
    <section className="bg-brand-dark text-white py-20 md:py-28 px-5 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl" />

      <div className="relative max-w-xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            El primer paso
          </span>
          <div className="w-8 h-px bg-brand-gold" />
        </div>

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-6">
          Si quer&eacute;s resolver tu cocina, empez&aacute; por una buena medici&oacute;n.
        </h2>
        <p className="text-brand-muted-dark mb-8 leading-relaxed">
          No hace falta que tengas todo claro todav&iacute;a. Con una visita, yo
          entiendo tu espacio y te doy un panorama real de qu&eacute; se puede
          hacer y cu&aacute;nto cuesta.
        </p>

        <div className="max-w-sm mx-auto mb-4">
          <WhatsAppButton text="Agendar medici&oacute;n por WhatsApp" pulse />
        </div>
        <p className="text-sm text-brand-muted-dark">
          Sin compromiso. La medici&oacute;n es el primer paso, no una obligaci&oacute;n de compra.
        </p>
      </div>
    </section>
  )
}
