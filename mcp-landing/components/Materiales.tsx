import { PROVEEDORES } from '@/lib/constants'
import Reveal from './cocinas/Reveal'
import { Eyebrow, Titulo } from './cocinas/ui'

// Las tres marcas con las que trabaja MCP. Las fotos salen de los catálogos
// oficiales de cada una (public/materiales/); para cambiar un diseño, reemplazá
// la imagen y el nombre acá.

interface Foto {
  src: string
  nombre: string
  detalle?: string
}

interface Marca {
  id: string
  marca: string
  rubro: string
  texto: string
  link: { url: string; cta: string }
  fotos: Foto[]
  aspecto: string
  columnas: string
}

const MARCAS: Marca[] = [
  {
    id: 'egger',
    marca: 'Egger',
    rubro: 'Placas',
    texto:
      'Todas las placas de melamina y MDF son Egger, importadas. Maderas, unicolores y texturas: estos son algunos de los diseños, el catálogo tiene muchos más.',
    link: PROVEEDORES.egger,
    aspecto: 'aspect-[16/10]',
    columnas: 'grid-cols-2 sm:grid-cols-4',
    fotos: [
      { src: '/materiales/egger-h1180.webp', nombre: 'Roble Halifax natural', detalle: 'H1180' },
      { src: '/materiales/egger-h1181.webp', nombre: 'Roble Halifax tabaco', detalle: 'H1181' },
      { src: '/materiales/egger-h1145.webp', nombre: 'Roble Bardolino natural', detalle: 'H1145' },
      { src: '/materiales/egger-h1367.webp', nombre: 'Roble Casella claro', detalle: 'H1367' },
      { src: '/materiales/egger-h1714.webp', nombre: 'Nogal Lincoln', detalle: 'H1714' },
      { src: '/materiales/egger-h1199.webp', nombre: 'Roble termo negro', detalle: 'H1199' },
      { src: '/materiales/egger-u665.webp', nombre: 'Verde mineral', detalle: 'U665' },
      { src: '/materiales/egger-u702.webp', nombre: 'Gris cachemira', detalle: 'U702' },
    ],
  },
  {
    id: 'grupo-euro',
    marca: 'Grupo Euro',
    rubro: 'Herrajes',
    texto:
      'Todos los herrajes son de la línea Grupo Euro: correderas, bisagras, pistones y accesorios. Es lo que hace que un cajón abra entero y cierre suave durante años.',
    link: PROVEEDORES.grupoEuro,
    aspecto: 'aspect-[4/5]',
    columnas: 'grid-cols-2 lg:grid-cols-4',
    fotos: [
      { src: '/materiales/euro-correderas.webp', nombre: 'Cajones y correderas', detalle: 'Extracción total, cierre suave' },
      { src: '/materiales/euro-bisagras.webp', nombre: 'Bisagras', detalle: 'Con amortiguación' },
      { src: '/materiales/euro-elevadores.webp', nombre: 'Elevadores y pistones', detalle: 'Para puertas de alacena' },
      { src: '/materiales/euro-despensa.webp', nombre: 'Despensas extraíbles', detalle: 'Columnas y accesorios' },
    ],
  },
  {
    id: 'johnson',
    marca: 'Johnson',
    rubro: 'Piletas',
    texto:
      'Las piletas que colocamos son Johnson, de acero inoxidable AISI 304. Simples o dobles, para bajo mesada o de apoyo.',
    link: PROVEEDORES.johnson,
    aspecto: 'aspect-square',
    columnas: 'grid-cols-2 lg:grid-cols-4',
    fotos: [
      { src: '/materiales/johnson-z52.webp', nombre: 'Johnson Z52', detalle: 'Simple' },
      { src: '/materiales/johnson-zn52.webp', nombre: 'Johnson ZN52', detalle: 'Simple' },
      { src: '/materiales/johnson-e37.webp', nombre: 'Johnson E37', detalle: 'Simple' },
      { src: '/materiales/johnson-c37.webp', nombre: 'Johnson C37', detalle: 'Doble' },
    ],
  },
]

export default function Materiales() {
  return (
    <section id="materiales" className="bg-brand-sand px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Materiales</Eyebrow>
            <Titulo
              className="mt-4 text-[2rem] md:text-[2.6rem]"
              recta="Las marcas que van adentro"
              italica="de tu cocina."
            />
            <p className="mt-5 font-body text-[15px] leading-relaxed text-brand-muted">
              No mezclamos buena placa con herrajes baratos. Trabajamos siempre con las mismas tres
              marcas, y podés ver sus catálogos completos antes de elegir.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-16 md:space-y-20">
          {MARCAS.map((m) => (
            <Reveal key={m.id}>
              <div className="min-w-0">
                <div className="flex flex-col gap-4 border-t border-brand-border pt-7 md:flex-row md:items-end md:justify-between md:gap-10">
                  <div className="min-w-0 max-w-xl">
                    <span className="font-body text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
                      {m.rubro}
                    </span>
                    <h3 className="mt-1.5 font-display text-[26px] font-semibold text-brand-dark">
                      {m.marca}
                    </h3>
                    <p className="mt-2 font-body text-[14px] leading-relaxed text-brand-muted">
                      {m.texto}
                    </p>
                  </div>
                  <a
                    href={m.link.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-brand-dark/15 bg-white px-4 py-2.5 font-body text-[13px] font-semibold text-brand-dark transition-colors hover:border-brand-gold hover:text-brand-gold md:self-auto"
                  >
                    {m.link.cta}
                    <span aria-hidden>&#8599;</span>
                  </a>
                </div>

                <ul className={`mt-6 grid gap-3 sm:gap-4 ${m.columnas}`}>
                  {m.fotos.map((f) => (
                    <li key={f.src} className="min-w-0">
                      <div
                        className={`${m.aspecto} overflow-hidden rounded-lg border border-brand-border bg-white`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.src}
                          alt={`${m.marca}: ${f.nombre}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-2 font-body text-[13px] font-semibold leading-snug text-brand-dark">
                        {f.nombre}
                      </p>
                      {f.detalle ? (
                        <p className="font-body text-[12px] leading-snug text-brand-muted">
                          {f.detalle}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-12 font-body text-[11.5px] text-brand-muted">
          Imágenes de los catálogos oficiales de Egger, Grupo Euro y Johnson Acero.
        </p>
      </div>
    </section>
  )
}
