import WhatsAppButton from '../WhatsAppButton'

const lineas = [
  {
    name: 'Económica',
    desc: 'Renovar la cocina sin gastar de más. Calidad garantizada, diseño limpio.',
    note: 'Desde · Sin colocación',
    price: '$310.000',
    unit: '/ ml',
    featured: false,
  },
  {
    name: 'Estándar',
    desc: 'La mejor relación calidad-precio. Melamina Egger + herrajes premium.',
    note: 'Desde',
    price: '$360.000',
    unit: '/ ml',
    featured: true,
  },
  {
    name: 'Premium',
    desc: 'Lo mejor en diseño y terminaciones. Para quienes quieren que dure décadas.',
    note: 'Desde · Colocación incluida',
    price: '$440.000',
    unit: '/ ml',
    featured: false,
  },
]

const granito = [
  { size: '1.20 m', price: '$440.000' },
  { size: '1.40 m', price: '$489.000' },
  { size: '1.60 m', price: '$534.000' },
  { size: '1.80 m', price: '$581.000' },
  { size: '2.00 m', price: '$627.000' },
]

export default function PreciosReferencia() {
  return (
    <section id="precios" className="px-5 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Precios de referencia
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
          Muebles de cocina desde $310.000 el metro lineal.
        </h2>
        <p className="text-brand-muted mb-14 max-w-lg">
          Tres l&iacute;neas pensadas para distintos presupuestos. Todas fabricadas a
          medida con materiales de calidad. Los precios son orientativos: tu proyecto
          se cotiza exacto seg&uacute;n medidas y terminaciones.
        </p>

        {/* Líneas por metro lineal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {lineas.map((linea) => (
            <div
              key={linea.name}
              className={`rounded-2xl p-7 relative ${
                linea.featured
                  ? 'bg-brand-dark text-white ring-2 ring-brand-gold/50 shadow-glow-gold'
                  : 'bg-white border border-brand-border'
              }`}
            >
              {linea.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-dark text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  M&aacute;s pedida
                </span>
              ) : null}
              <h3 className="font-bold text-xl mb-2">{linea.name}</h3>
              <p
                className={`text-sm leading-relaxed mb-6 ${
                  linea.featured ? 'text-brand-muted-dark' : 'text-brand-muted'
                }`}
              >
                {linea.desc}
              </p>
              <div
                className={`text-xs uppercase tracking-wider mb-1 ${
                  linea.featured ? 'text-brand-gold' : 'text-brand-muted'
                }`}
              >
                {linea.note}
              </div>
              <div className="font-serif text-4xl">
                {linea.price}
                <span
                  className={`text-base font-sans ml-1 ${
                    linea.featured ? 'text-brand-muted-dark' : 'text-brand-muted'
                  }`}
                >
                  {linea.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-xs mx-auto mb-20">
          <WhatsAppButton
            text="Quiero saber el precio exacto"
            size="small"
            placement="proyecto_precios"
            message="Hola Marcelo, vi los precios de referencia en la web y quiero cotizar mi cocina."
          />
        </div>

        {/* Granito instalado */}
        <div className="bg-brand-dark text-white rounded-2xl p-8 md:p-12 relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(196,162,69,0.08)_0%,transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-brand-gold" />
              <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
                Mesadas de granito
              </span>
            </div>
            <h3 className="font-serif text-2xl md:text-3xl mb-8">
              Granito instalado, colocaci&oacute;n incluida.
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {granito.map((item) => (
                <div
                  key={item.size}
                  className="border border-white/10 rounded-xl p-4 text-center bg-white/[0.03]"
                >
                  <div className="font-bold text-lg mb-1">{item.size}</div>
                  <div className="text-brand-gold font-serif text-xl mb-1">{item.price}</div>
                  <div className="text-[11px] uppercase tracking-wider text-brand-muted-dark">
                    Colocaci&oacute;n incl.
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-muted-dark mt-6">
              * Precios en pesos argentinos &middot; Medidas especiales y trabajos en L a
              consultar &middot; Financiaci&oacute;n disponible
            </p>
          </div>
        </div>

        {/* Presupuesto detallado */}
        <div className="bg-white border border-brand-border rounded-2xl p-8 md:p-10 md:flex md:items-center md:justify-between md:gap-10">
          <div className="mb-6 md:mb-0">
            <h3 className="font-bold text-xl mb-2">
              &iquest;Quer&eacute;s un presupuesto detallado con visita?
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed max-w-xl">
              El estudio previo incluye mediciones precisas, asesoramiento, dise&ntilde;o y
              presupuesto itemizado por escrito. Cuesta{' '}
              <span className="font-semibold text-brand-dark">$40.000</span> y{' '}
              <span className="font-semibold text-brand-dark">
                se descuenta del total si avanz&aacute;s con el proyecto
              </span>
              . Si no avanz&aacute;s, te qued&aacute;s con medidas exactas y un presupuesto
              profesional para comparar.
            </p>
          </div>
          <div className="flex-shrink-0">
            <WhatsAppButton
              text="Coordinar visita"
              size="small"
              fullWidth={false}
              placement="proyecto_estudio_previo"
              message="Hola Marcelo, quiero coordinar una visita para el presupuesto detallado ($40.000 descontables del total)."
            />
          </div>
        </div>
      </div>
    </section>
  )
}
