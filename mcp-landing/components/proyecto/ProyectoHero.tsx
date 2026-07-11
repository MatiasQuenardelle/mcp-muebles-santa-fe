import WhatsAppButton from '../WhatsAppButton'

const checks = [
  'Melamina Egger importada',
  'Correderas Grupo Euro',
  'Colocación incluida',
  'Sin costos ocultos',
]

export default function ProyectoHero() {
  return (
    <section className="bg-brand-dark text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(196,162,69,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(196,162,69,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-3xl mx-auto px-5 py-16 md:py-24 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Gu&iacute;a de compra &middot; Precios de referencia
          </span>
          <div className="w-8 h-px bg-brand-gold" />
        </div>

        <h1 className="font-serif text-4xl md:text-5xl leading-[1.12] mb-6">
          Tu cocina a medida,{' '}
          <em className="text-gradient-gold not-italic">sin sorpresas.</em>
        </h1>

        <p className="text-brand-muted-dark text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          Todo lo que ten&eacute;s que saber antes de encargar tu cocina: c&oacute;mo
          trabajamos, qu&eacute; materiales usamos y cu&aacute;nto cuesta. Le&eacute;lo
          tranquilo y escribinos cuando quieras.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <WhatsAppButton
            text="Pedir presupuesto por WhatsApp"
            size="small"
            fullWidth={false}
            placement="proyecto_hero"
            message="Hola Marcelo, estuve leyendo la guía de Proyecto Cocina y quiero pedir un presupuesto."
          />
          <a
            href="#precios"
            className="text-sm text-brand-muted-dark underline underline-offset-4 hover:text-white transition-colors"
          >
            Ver precios de referencia ↓
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-muted-dark mb-12">
          {checks.map((check) => (
            <span key={check} className="inline-flex items-center gap-2">
              <span className="text-brand-gold">✓</span>
              {check}
            </span>
          ))}
        </div>

        <div className="relative rounded-2xl overflow-hidden ring-1 ring-brand-gold/20">
          <img
            src="/cocina-oscura.png"
            alt="Cocina a medida fabricada e instalada por MCP en Santa Fe"
            className="w-full aspect-[4/3] sm:aspect-[16/9] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 text-left text-xs text-white/80">
            Trabajo real: cocina fabricada e instalada por MCP en Santa Fe
          </p>
        </div>
      </div>
    </section>
  )
}
