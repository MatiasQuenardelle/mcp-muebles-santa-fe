const MAPS_LINK =
  'https://www.google.com/maps/place/MCP+Muebles+%E2%80%93+Fabrica+de+muebles+de+cocinas/@-31.6104287,-60.6902168,17z/data=!3m1!4b1!4m6!3m5!1s0x95b507c7c6fac5c9:0x514cab0ca3f96398!8m2!3d-31.6104287!4d-60.6902168!16s%2Fg%2F11yhknrj08'

export default function Location() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            D&oacute;nde estamos
          </span>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
          <div className="mb-8 md:mb-0">
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
              Vení a conocer<br />nuestro taller.
            </h2>
            <p className="text-brand-muted leading-relaxed mb-6">
              Estamos en Santa Fe capital. Pod&eacute;s visitarnos para ver materiales,
              terminaciones y trabajos en proceso.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-gold mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-brand-muted">Santa Fe, Argentina</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-gold mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-brand-muted">Lunes a viernes &middot; 8:00 a 17:00</span>
              </div>
            </div>

            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-gold font-semibold text-sm hover:underline"
            >
              Ver en Google Maps
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

          <div className="rounded-xl overflow-hidden ring-1 ring-black/10 aspect-[4/3]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3397.5!2d-60.6902168!3d-31.6104287!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b507c7c6fac5c9%3A0x514cab0ca3f96398!2sMCP%20Muebles%20%E2%80%93%20Fabrica%20de%20muebles%20de%20cocinas!5e0!3m2!1ses!2sar!4v1713200000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de MCP - Muebles a Medida en Santa Fe"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
