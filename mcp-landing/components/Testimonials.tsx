const testimonials = [
  {
    quote:
      'Me qued\u00e9 sorprendida. Me pidieron la foto, me mandaron el dise\u00f1o en 3D y en dos semanas ten\u00eda la cocina puesta. La bacha ya est\u00e1 conectada y todo queda perfecto. M\u00e1s f\u00e1cil imposible.',
    name: 'Mar\u00eda A.',
    location: 'Santa Fe \u00b7 Barrio Sur',
  },
  {
    quote:
      'Yo no ten\u00eda idea de medidas ni de nada. Me dijeron que mandara una foto y ellos se encargaban. En el d\u00eda me contestaron con precio y todo. Qued\u00f3 re linda y no pagu\u00e9 ning\u00fan extra.',
    name: 'Roberto G.',
    location: 'Santo Tom\u00e9',
  },
  {
    quote:
      'Ped\u00ed presupuesto en tres carpinter\u00edas. MCP fue el \u00fanico que me contest\u00f3 el mismo d\u00eda y el que m\u00e1s claro me explic\u00f3 todo. Encima la calidad es otra cosa. No me arrepiento para nada.',
    name: 'Laura P.',
    location: 'Santa Fe Capital',
  },
]

function Stars() {
  return (
    <div className="flex gap-0.5 text-brand-gold">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('')
  return (
    <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-sm">
      {initials}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="bg-brand-dark text-white px-5 py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(196,162,69,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Lo que dicen los clientes
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-12">
          481 cocinas hablan<br />por nosotros.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="border border-white/10 rounded-xl p-6 relative bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-300"
            >
              <div className="absolute top-4 right-5 text-5xl text-brand-gold/15 select-none font-serif leading-none">
                &ldquo;
              </div>
              <Stars />
              <p className="text-sm leading-relaxed mt-4 mb-6 text-brand-muted-dark pr-6">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <Avatar name={t.name} />
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-brand-muted-dark">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
