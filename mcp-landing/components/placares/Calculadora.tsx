'use client'

import { useMemo, useState } from 'react'
import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import { PLACARES, pesos, precioPlacard } from '@/lib/precios.mjs'
import { Eyebrow, IconoWhatsApp, Titulo, formatearPesos } from '@/components/cocinas/ui'
import { MEDIDAS, SELECCION_INICIAL, metros, type Medida, type SeleccionPlacard } from './data'

const m3 = (v: number) => v.toFixed(2).replace('.', ',')

function Paso({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </p>
  )
}

/** Placard en perspectiva con las tres medidas, para explicar la cuenta del m³. */
function Dibujo({ s }: { s: SeleccionPlacard }) {
  const cota = 'fill-brand-gold text-[13px] font-semibold'
  return (
    <svg viewBox="0 0 320 250" className="h-auto w-full max-w-[320px]" role="img" aria-label="Ancho por alto por profundidad">
      {/* frente */}
      <rect x="40" y="50" width="170" height="160" className="fill-white stroke-brand-dark" strokeWidth="2" />
      <line x1="125" y1="50" x2="125" y2="210" className="stroke-brand-dark/40" strokeWidth="1.5" />
      {/* techo y lateral */}
      <polygon points="40,50 90,20 260,20 210,50" className="fill-brand-cream stroke-brand-dark" strokeWidth="2" />
      <polygon points="210,50 260,20 260,180 210,210" className="fill-brand-sand stroke-brand-dark" strokeWidth="2" />
      {/* ancho */}
      <line x1="40" y1="228" x2="210" y2="228" className="stroke-brand-gold" strokeWidth="1.5" />
      <text x="125" y="246" textAnchor="middle" className={cota}>
        Ancho {metros(s.ancho)} m
      </text>
      {/* alto */}
      <line x1="22" y1="50" x2="22" y2="210" className="stroke-brand-gold" strokeWidth="1.5" />
      <text x="16" y="130" textAnchor="middle" transform="rotate(-90 16 130)" className={cota}>
        Alto {metros(s.alto)} m
      </text>
      {/* profundidad */}
      <line x1="222" y1="208" x2="272" y2="178" className="stroke-brand-gold" strokeWidth="1.5" />
      <text x="262" y="210" className={cota}>
        <tspan x="250" dy="0">Prof.</tspan>
        <tspan x="250" dy="15">{metros(s.profundidad)} m</tspan>
      </text>
    </svg>
  )
}

function Medidor({
  nombre,
  ayuda,
  valor,
  rango,
  onChange,
}: {
  nombre: string
  ayuda: string
  valor: number
  rango: { min: number; max: number; paso: number }
  onChange: (cm: number) => void
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[18px] font-semibold text-brand-dark">{nombre}</p>
          <p className="text-[12.5px] text-brand-muted">{ayuda}</p>
        </div>
        <div className="flex items-center rounded border border-brand-dark">
          <button
            type="button"
            onClick={() => onChange(valor - rango.paso)}
            disabled={valor <= rango.min}
            aria-label={`Restar ${rango.paso} cm de ${nombre.toLowerCase()}`}
            className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
          >
            −
          </button>
          <output
            aria-live="polite"
            className="min-w-[4.5rem] text-center text-[14px] font-semibold tabular-nums text-brand-dark"
          >
            {metros(valor)} m
          </output>
          <button
            type="button"
            onClick={() => onChange(valor + rango.paso)}
            disabled={valor >= rango.max}
            aria-label={`Sumar ${rango.paso} cm de ${nombre.toLowerCase()}`}
            className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>
      <input
        type="range"
        min={rango.min}
        max={rango.max}
        step={rango.paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${nombre} en centímetros`}
        className="mt-3 w-full accent-brand-dark"
      />
      <div className="flex justify-between text-[11px] tabular-nums text-brand-muted">
        <span>{metros(rango.min)} m</span>
        <span>{metros(rango.max)} m</span>
      </div>
    </div>
  )
}

export default function Calculadora() {
  const [s, setS] = useState<SeleccionPlacard>(SELECCION_INICIAL)
  const { m3: volumen, precio } = useMemo(
    () => precioPlacard(s.ancho, s.alto, s.profundidad),
    [s.ancho, s.alto, s.profundidad],
  )

  const setMedida = (id: Medida, cm: number) =>
    setS((p) => ({ ...p, [id]: Math.min(Math.max(cm, PLACARES[id].min), PLACARES[id].max) }))

  const cuenta = `${metros(s.ancho)} × ${metros(s.alto)} × ${metros(s.profundidad)} = ${m3(volumen)} m³`

  const mensaje = [
    'Hola Marcelo, armé este placard en la calculadora de la web:',
    `· Medidas: ${metros(s.ancho)} m de ancho × ${metros(s.alto)} m de alto × ${metros(s.profundidad)} m de profundidad (${m3(volumen)} m³)`,
    `· Puertas: ${s.puertas}`,
    `Precio de referencia: ${formatearPesos(precio)}`,
    '¿Me confirmás el precio exacto para mis medidas?',
  ].join('\n\n')

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
            El precio sale por metro cúbico: ancho × alto × profundidad. Poné las tres medidas y la
            calculadora hace la cuenta por vos.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-lg border border-brand-border bg-white lg:grid lg:grid-cols-[1fr_400px]">
          <div className="min-w-0 p-6 sm:p-9">
            <Paso>1 · Las medidas de tu placard</Paso>

            <div className="mt-5 flex flex-col items-center gap-3 rounded-md border border-brand-gold/40 bg-brand-gold/[0.06] p-5 sm:flex-row sm:gap-6">
              <Dibujo s={s} />
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                  La cuenta
                </p>
                <p className="mt-1.5 font-display text-[19px] font-semibold leading-snug text-brand-dark">
                  Ancho × Alto × Profundidad
                </p>
                <p className="mt-1 text-[14px] tabular-nums text-brand-dark">{cuenta}</p>
                <p className="mt-1 text-[13px] text-brand-muted">
                  × {pesos(PLACARES.precioM3)} el m³
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {MEDIDAS.map((m) => (
                <Medidor
                  key={m.id}
                  nombre={m.nombre}
                  ayuda={m.ayuda}
                  valor={s[m.id]}
                  rango={PLACARES[m.id]}
                  onChange={(cm) => setMedida(m.id, cm)}
                />
              ))}
            </div>

            <div className="mt-10">
              <Paso>2 · Puertas</Paso>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(['corredizas', 'batientes'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setS((p) => ({ ...p, puertas: tipo }))}
                    aria-pressed={s.puertas === tipo}
                    className={`min-w-0 rounded-md border px-4 py-3 text-left text-[14px] font-semibold capitalize text-brand-dark transition-all ${
                      s.puertas === tipo
                        ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold'
                        : 'border-brand-border hover:border-brand-gold/50'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
              <p className="mt-2.5 text-[12.5px] text-brand-muted">
                El tipo de puerta se ajusta en el presupuesto final.
              </p>
            </div>
          </div>

          <div className="min-w-0 bg-brand-dark p-6 text-white sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Tu presupuesto
            </p>

            <div className="mt-6 space-y-3 border-b border-white/10 pb-6 text-[13.5px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-brand-muted-dark">Medidas</span>
                <span className="tabular-nums">
                  {metros(s.ancho)} × {metros(s.alto)} × {metros(s.profundidad)} m
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-brand-muted-dark">Volumen</span>
                <span className="tabular-nums">{m3(volumen)} m³</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-brand-muted-dark">Puertas</span>
                <span className="capitalize">{s.puertas}</span>
              </div>
            </div>

            <div className="pt-6">
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-muted-dark">
                Precio de referencia
              </span>
              <p className="mt-2 font-display text-[2.5rem] leading-none tabular-nums text-brand-gold">
                {formatearPesos(precio)}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-brand-muted-dark">
                Estimado sujeto a las medidas exactas en obra, el tipo de puerta, la distribución
                interior y las terminaciones que elijas. Lo terminamos de afinar al cotizar.
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
