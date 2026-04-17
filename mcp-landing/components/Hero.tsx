import { BASE_PRICE_LABEL, WHATSAPP_DISPLAY_NUMBER } from '@/lib/constants'
import HeroIntentOptions from './HeroIntentOptions'
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
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="inline-flex items-center rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              {BASE_PRICE_LABEL}
            </span>
            <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
              MCP - Muebles a Medida &middot; Santa Fe
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.12] mb-6">
            Cocinas a medida con presupuesto{' '}
            <em className="text-gradient-gold not-italic">claro desde el primer mensaje</em>
          </h1>

          <p className="text-brand-muted-dark text-lg leading-relaxed mb-8 max-w-lg">
            Te atiende Marcelo directo. Mand&aacute;s una foto o medidas aproximadas y
            recib&iacute;s orientaci&oacute;n, rango de precio y pr&oacute;ximo paso sin vueltas.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-8 max-w-xl">
            <p className="text-sm font-semibold text-white mb-3">
              Para cotizar m&aacute;s r&aacute;pido, mandanos esto por WhatsApp:
            </p>
            <div className="grid gap-3 sm:grid-cols-3 text-sm text-brand-muted-dark">
              <div className="rounded-xl border border-white/10 bg-brand-dark/60 px-4 py-3">
                1. Foto del espacio
              </div>
              <div className="rounded-xl border border-white/10 bg-brand-dark/60 px-4 py-3">
                2. Medidas aproximadas
              </div>
              <div className="rounded-xl border border-white/10 bg-brand-dark/60 px-4 py-3">
                3. Barrio o ciudad
              </div>
            </div>
          </div>

          <div className="block max-w-xs md:max-w-sm mb-3">
            <WhatsAppButton
              text="Quiero precio por WhatsApp"
              pulse
              size="small"
              placement="hero_primary"
              message="Hola Marcelo, quiero consultar por una cocina a medida y pedir un presupuesto."
            />
          </div>
          <p className="text-sm text-brand-muted-dark">
            Presupuesto sin compromiso &middot; Respuesta en el d&iacute;a &middot; Atenci&oacute;n directa
          </p>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold/80 mb-3">
              Eleg&iacute; c&oacute;mo quer&eacute;s arrancar
            </p>
            <HeroIntentOptions />
          </div>

          {WHATSAPP_DISPLAY_NUMBER ? (
            <p className="text-sm text-brand-muted-dark mt-5">
              Si prefer&iacute;s agendarlo primero, escribinos al{' '}
              <span className="font-semibold text-white">{WHATSAPP_DISPLAY_NUMBER}</span>.
            </p>
          ) : null}
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
