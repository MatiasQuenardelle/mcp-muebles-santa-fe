import { PRECIOS_ACTUALIZADOS } from './data'

const columnas = [
  {
    titulo: 'Qué fabricamos',
    items: [
      'Cocinas a medida',
      'Mesadas de granito',
      'Mesadas de sintético',
      'Placards y vestidores',
      'Muebles de baño y vanitorys',
      'Muebles de living a medida',
    ],
  },
  {
    titulo: 'Zona de trabajo',
    items: ['Santa Fe Capital', 'Santo Tomé', 'Recreo', 'Rincón', 'Alrededores a consultar'],
  },
  {
    titulo: 'La página',
    items: [
      { texto: 'Líneas y precios', href: '#lineas' },
      { texto: 'Calculadora', href: '#calculadora' },
      { texto: 'Trabajos entregados', href: '#trabajos' },
      { texto: 'Mesadas', href: '#mesadas' },
      { texto: 'Preguntas frecuentes', href: '#preguntas' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-dark px-5 py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <p className="font-display text-[22px] font-semibold text-white">
              MCP <span className="italic text-brand-gold">Muebles a Medida</span>
            </p>
            <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed text-brand-muted-dark">
              Fábrica de cocinas y amoblamientos a medida en Santa Fe Capital. Más de 20 años,
              481 cocinas entregadas y garantía escrita de 12 meses.
            </p>
          </div>

          {columnas.map((c) => (
            <div key={c.titulo} className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
                {c.titulo}
              </p>
              <ul className="mt-4 space-y-2">
                {c.items.map((item) => {
                  const texto = typeof item === 'string' ? item : item.texto
                  const href = typeof item === 'string' ? null : item.href
                  return (
                    <li key={texto} className="text-[13px] text-brand-muted-dark">
                      {href ? (
                        <a href={href} className="transition-colors hover:text-brand-gold">
                          {texto}
                        </a>
                      ) : (
                        texto
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-7 text-center">
          <p className="text-[12px] text-brand-muted-dark">
            &copy; {new Date().getFullYear()} MCP · Muebles a Medida &middot; Santa Fe,
            Argentina
          </p>
          <p className="mx-auto mt-2 max-w-[70ch] text-[11.5px] leading-relaxed text-brand-muted-dark/60">
            Lista de precios actualizada a {PRECIOS_ACTUALIZADOS}, en pesos argentinos. Los
            valores de la calculadora son orientativos: el precio final surge del relevamiento
            del espacio. Medidas especiales y trabajos en L se cotizan aparte.
          </p>
        </div>
      </div>
    </footer>
  )
}
