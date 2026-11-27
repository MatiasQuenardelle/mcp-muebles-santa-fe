'use client'

import { useMemo, useState } from 'react'
import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { PLACARES, pesos } from '@/lib/precios.mjs'
import { Eyebrow, IconoWhatsApp, Titulo, formatearPesos } from '@/components/cocinas/ui'
import { SELECCION_INICIAL, cotizarPlacard, metros, type SeleccionPlacard } from './data'

function Paso({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </p>
  )
}

function Opcion({
  activo,
  onClick,
  titulo,
  detalle,
}: {
  activo: boolean
  onClick: () => void
  titulo: string
  detalle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`min-w-0 rounded-md border px-4 py-3 text-left transition-all ${
        activo
          ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold'
          : 'border-brand-border hover:border-brand-gold/50'
      }`}
    >
      <span className="block text-[14px] font-semibold text-brand-dark">{titulo}</span>
      <span className="mt-0.5 block text-[12px] text-brand-muted">{detalle}</span>
    </button>
  )
}

function Contador({
  valor,
  min,
  max,
  onChange,
  etiqueta,
  formato = String,
}: {
  valor: number
  min: number
  max: number
  onChange: (v: number) => void
  etiqueta: string
  formato?: (v: number) => string
}) {
  return (
    <div className="flex w-fit items-center rounded border border-brand-dark">
      <button
        type="button"
        onClick={() => onChange(valor - 1)}
        disabled={valor <= min}
        aria-label={`Menos ${etiqueta}`}
        className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
      >
        −
      </button>
      <output
        aria-live="polite"
        className="min-w-[4.5rem] text-center text-[14px] font-semibold tabular-nums text-brand-dark"
      >
        {formato(valor)}
      </output>
      <button
        type="button"
        onClick={() => onChange(valor + 1)}
        disabled={valor >= max}
        aria-label={`Más ${etiqueta}`}
        className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

export default function Calculadora() {
  const [s, setS] = useState<SeleccionPlacard>(SELECCION_INICIAL)
  const { renglones, total } = useMemo(() => cotizarPlacard(s), [s])

  const setAncho = (cm: number) =>
    setS((p) => ({ ...p, ancho: Math.min(Math.max(cm, PLACARES.anchoMin), PLACARES.anchoMax) }))

  const mensaje = useMemo(
    () =>
      [
        'Hola Marcelo, armé este placard en la calculadora de la web:',
        renglones
          .map((r) => `· ${r.nombre}${r.medida ? ` ${r.medida}` : ''} — ${formatearPesos(r.precio)}`)
          .join('\n'),
        `Total orientativo: ${formatearPesos(total)}`,
        '¿Me confirmás el precio exacto para mis medidas?',
      ].join('\n\n'),
    [renglones, total],
  )

  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: mensaje,
    ctaLabel: 'Enviar presupuesto por WhatsApp',
    placement: 'placares_calculadora',
  })

  return (
    <section id="calculadora" className="relative bg-brand-cream px-5 py-20 md:py-28">
      <div className="relative mx-auto max-w-[1180px]">
        <div className="max-w-2xl">
          <Eyebrow>Calculadora de precios</Eyebrow>
          <Titulo
            className="mt-4 text-[2rem] md:text-[2.6rem]"
            recta="Armá tu placard y mirá"
            italica="cuánto sale, ahora."
          />
          <p className="mt-5 text-[15px] leading-relaxed text-brand-muted">
            Poné el ancho de la pared (de a 10 cm) y elegí las puertas. Es orientativo: el precio
            final sale de medir tu espacio, pero te deja saber en qué rango estás parado.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-lg border border-brand-border bg-white lg:grid lg:grid-cols-[1fr_400px]">
          <div className="min-w-0 p-6 sm:p-9">
            <div>
              <Paso>1 · Ancho del placard</Paso>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">
                De piso a techo, con bauleras, cajonera, pantalonero y barral.{' '}
                {pesos(PLACARES.precioMetro)} el metro de ancho.
              </p>
              <div className="mt-4">
                <Contador
                  valor={s.ancho / PLACARES.paso}
                  min={PLACARES.anchoMin / PLACARES.paso}
                  max={PLACARES.anchoMax / PLACARES.paso}
                  onChange={(v) => setAncho(v * PLACARES.paso)}
                  etiqueta={`${PLACARES.paso} cm`}
                  formato={(v) => `${metros(v * PLACARES.paso)} m`}
                />
                <input
                  type="range"
                  min={PLACARES.anchoMin}
                  max={PLACARES.anchoMax}
                  step={PLACARES.paso}
                  value={s.ancho}
                  onChange={(e) => setAncho(Number(e.target.value))}
                  aria-label="Ancho en centímetros"
                  className="mt-3 w-full accent-brand-dark"
                />
                <div className="flex justify-between text-[11px] tabular-nums text-brand-muted">
                  <span>{metros(PLACARES.anchoMin)} m</span>
                  <span>{metros(PLACARES.anchoMax)} m</span>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Paso>2 · Puertas</Paso>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Opcion
                  activo={s.puertas === 'batientes'}
                  onClick={() => setS((p) => ({ ...p, puertas: 'batientes' }))}
                  titulo="Batientes"
                  detalle="Incluidas en el precio"
                />
                <Opcion
                  activo={s.puertas === 'corredizas'}
                  onClick={() => setS((p) => ({ ...p, puertas: 'corredizas' }))}
                  titulo="Corredizas"
                  detalle={`+ ${pesos(PLACARES.corredizas)}`}
                />
              </div>
            </div>

            <div className="mt-10">
              <Paso>3 · Puertas con espejo</Paso>
              <p className="mt-2 text-[13px] text-brand-muted">
                + {pesos(PLACARES.espejo)} por puerta. Dejalo en 0 si no querés espejo.
              </p>
              <div className="mt-4">
                <Contador
                  valor={s.espejos}
                  min={0}
                  max={PLACARES.espejosMax}
                  onChange={(espejos) => setS((p) => ({ ...p, espejos }))}
                  etiqueta="puertas con espejo"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 bg-brand-dark p-6 text-white sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Tu presupuesto
            </p>

            <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
              {renglones.map((r) => (
                <div key={r.nombre} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-[13.5px] text-brand-muted-dark">
                    {r.nombre} <span className="tabular-nums text-white/50">{r.medida}</span>
                  </span>
                  <span className="flex-shrink-0 text-[13.5px] tabular-nums">
                    {formatearPesos(r.precio)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-muted-dark">
                Total orientativo
              </span>
              <p className="mt-2 font-display text-[2.5rem] leading-none tabular-nums text-brand-gold">
                {formatearPesos(total)}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-brand-muted-dark">
                Incluye medición, fabricación y colocación. Precios de referencia en pesos.
              </p>
            </div>

            <a
              href={href}
              onClick={handleClick}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-md bg-brand-gold px-5 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-brand-dark transition-all hover:bg-brand-gold-light"
            >
              <IconoWhatsApp />
              Enviar este presupuesto
            </a>
            <p className="mt-3 text-center text-[11.5px] text-brand-muted-dark">
              Te llega a Marcelo con el detalle ya escrito.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
