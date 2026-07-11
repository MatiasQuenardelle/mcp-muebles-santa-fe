import WhatsAppButton from '../WhatsAppButton'

export default function ProyectoCTA() {
  return (
    <section className="bg-brand-dark text-white py-20 md:py-28 px-5 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl" />

      <div className="relative max-w-xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Siguiente paso
          </span>
          <div className="w-8 h-px bg-brand-gold" />
        </div>

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-6">
          &iquest;Empezamos?
        </h2>
        <p className="text-brand-muted-dark mb-8 leading-relaxed">
          Mandanos un mensaje, contanos qu&eacute; necesit&aacute;s y te pasamos un
          presupuesto sin compromiso. Sin formularios, sin esperas.
        </p>

        <div className="max-w-sm mx-auto mb-4">
          <WhatsAppButton
            text="Escribinos por WhatsApp"
            pulse
            size="small"
            placement="proyecto_final_cta"
            message="Hola Marcelo, leí la guía de Proyecto Cocina y quiero avanzar con mi presupuesto."
          />
        </div>
        <p className="text-sm text-brand-muted-dark">
          Respondemos en minutos &middot; Agenda de instalaci&oacute;n limitada para este mes
        </p>
      </div>
    </section>
  )
}
