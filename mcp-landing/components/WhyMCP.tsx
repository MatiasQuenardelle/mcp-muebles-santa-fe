const pillars = [
  {
    num: '01',
    title: 'Dise\u00f1o funcional',
    desc: 'Cada cocina se dise\u00f1a pensando en c\u00f3mo vas a usarla, no solo en c\u00f3mo va a quedar. El espacio trabaja para vos.',
  },
  {
    num: '02',
    title: 'Ejecuci\u00f3n real',
    desc: 'Lo que se dise\u00f1a, se construye. Sin sorpresas, sin improvisaciones. Fabricaci\u00f3n en melamina de calidad con instalaci\u00f3n prolija.',
  },
  {
    num: '03',
    title: 'Un solo interlocutor',
    desc: 'Habl\u00e1s conmigo desde el primer d\u00eda hasta el \u00faltimo. Sin intermediarios, sin tel\u00e9fono descompuesto.',
  },
]

export default function WhyMCP() {
  return (
    <section className="bg-brand-dark text-white px-5 py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(196,162,69,0.06)_0%,transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Por qu&eacute; MCP - Muebles a Medida
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-14 max-w-2xl">
          No soy solo fabricante.<br />
          Soy el profesional que piensa tu espacio.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p) => (
            <div key={p.num} className="border-t border-white/15 pt-6 group">
              <div className="text-3xl font-bold text-gradient-gold mb-3">{p.num}</div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-brand-gold transition-colors duration-300">{p.title}</h3>
              <p className="text-sm text-brand-muted-dark leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
