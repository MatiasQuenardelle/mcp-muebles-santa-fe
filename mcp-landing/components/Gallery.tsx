const photos = [
  { src: '/cocina-oscura.png', alt: 'Cocina moderna oscura con electrodom\u00e9sticos integrados', className: 'md:col-span-2 aspect-[16/9]' },
  { src: '/cocina-madera.png', alt: 'Cocina en madera con esquinero', className: 'aspect-square' },
  { src: '/cocina-blanca.png', alt: 'Cocina blanca con mesada de granito', className: 'aspect-square' },
  { src: '/cocina-lineal.png', alt: 'Cocina lineal con muebles superiores', className: 'md:col-span-2 aspect-[16/9]' },
]

export default function Gallery() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-brand-gold" />
          <span className="text-sm tracking-[0.2em] text-brand-gold uppercase">
            Trabajos realizados
          </span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
          Proyectos que<br />hablan solos.
        </h2>
        <p className="text-brand-muted mb-10">
          Fotos reales de cocinas fabricadas e instaladas por MCP - Muebles a Medida en Santa Fe.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div key={i} className={`group overflow-hidden rounded-xl ${photo.className} relative cursor-pointer`}>
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-xs font-medium">{photo.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
