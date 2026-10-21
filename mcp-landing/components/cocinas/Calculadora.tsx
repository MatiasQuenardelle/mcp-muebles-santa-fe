'use client'

import { useMemo, useState } from 'react'
import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import {
  LARGO_MAX,
  LARGO_MIN,
  LARGO_PASO,
  LINEAS,
  MODULOS,
  PRECIOS_ACTUALIZADOS,
  precioModulo,
  type LineaId,
  type ModuloId,
} from './data'
import { Eyebrow, IconoWhatsApp, Titulo, formatearPesos } from './ui'

/** Largo en cm. Se recuerda aunque el módulo no entre en el presupuesto. */
type Seleccion = Record<ModuloId, { largo: number; incluido: boolean }>

const SELECCION_INICIAL: Seleccion = {
  bajoMesada: { largo: 200, incluido: true },
  alacena: { largo: 160, incluido: true },
  mesada: { largo: 200, incluido: false },
}

const NOTA_COLOCACION: Record<LineaId, string> = {
  economica: 'Sin colocación · entrega a domicilio',
  estandar: 'Colocación a convenir, se cotiza aparte',
  premium: 'Colocación profesional incluida',
}

const metros = (largo: number) => (largo / 100).toFixed(2)

export default function Calculadora() {
  const [linea, setLinea] = useState<LineaId>('estandar')
  const [seleccion, setSeleccion] = useState<Seleccion>(SELECCION_INICIAL)

  const ajustarLargo = (id: ModuloId, largo: number) =>
    setSeleccion((s) => ({
      ...s,
      [id]: { largo: Math.min(Math.max(largo, LARGO_MIN), LARGO_MAX), incluido: true },
    }))

  const alternarModulo = (id: ModuloId) =>
    setSeleccion((s) => ({ ...s, [id]: { ...s[id], incluido: !s[id].incluido } }))

  const items = useMemo(
    () =>
      MODULOS.filter((m) => seleccion[m.id].incluido).map((m) => ({
        id: m.id,
        nombre: m.nombre,
        medida: metros(seleccion[m.id].largo),
        precio: precioModulo(linea, m.id, seleccion[m.id].largo),
      })),
    [linea, seleccion]
  )

  const total = items.reduce((acc, i) => acc + i.precio, 0)
  const nombreLinea = LINEAS.find((l) => l.id === linea)?.nombre ?? ''

  const mensaje = useMemo(() => {
    if (items.length === 0) {
      return 'Hola Marcelo, quiero armar el presupuesto de mi cocina a medida.'
    }
    const detalle = items
      .map((i) => `· ${i.nombre} ${i.medida} m — ${formatearPesos(i.precio)}`)
      .join('\n')
    return [
      `Hola Marcelo, armé este presupuesto en la calculadora de la web (línea ${nombreLinea}):`,
      detalle,
      `Total orientativo: ${formatearPesos(total)}`,
      '¿Me confirmás el precio exacto para mis medidas?',
    ].join('\n\n')
  }, [items, nombreLinea, total])

  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: mensaje,
    ctaLabel: 'Enviar presupuesto por WhatsApp',
    placement: 'cocinas_calculadora',
  })

  return (
    <section id="calculadora" className="relative bg-brand-ink px-5 py-20 md:py-28">
      <div className="cc-trama absolute inset-0" />

      <div className="relative mx-auto max-w-[1180px]">
        <div className="max-w-2xl">
          <Eyebrow tono="oscuro">Calculadora de precios</Eyebrow>
          <Titulo
            tono="oscuro"
            className="mt-4 text-[2rem] md:text-[2.6rem]"
            recta="Armá tu cocina y mirá"
            italica="cuánto sale, ahora."
          />
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            Elegí la línea, poné los metros lineales de cada módulo (de a 10 cm) y la
            calculadora te da el número con la lista de precios de MCP. Es orientativo: el
            precio final sale del relevamiento de tu espacio, pero te deja saber en qué rango
            estás parado.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-lg border border-white/10 bg-white lg:grid lg:grid-cols-[1fr_400px]">
          {/* ── Controles ─────────────────────────────────────────── */}
          <div className="min-w-0 p-6 sm:p-9">
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                1 · Elegí la línea
              </legend>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {LINEAS.map((l) => {
                  const activa = l.id === linea
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLinea(l.id)}
                      aria-pressed={activa}
                      className={`min-w-0 rounded-md border px-4 py-3 text-left transition-all ${
                        activa
                          ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold'
                          : 'border-brand-border hover:border-brand-gold/50'
                      }`}
                    >
                      <span className="block font-display text-[17px] font-semibold text-brand-dark">
                        {l.nombre}
                      </span>
                      <span className="mt-0.5 block text-[11px] uppercase tracking-[0.1em] text-brand-muted">
                        {l.claim}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[12.5px] text-brand-muted">
                {NOTA_COLOCACION[linea]}
              </p>
            </fieldset>

            <div className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                2 · Poné los metros lineales
              </p>

              <div className="mt-5 space-y-7">
                {MODULOS.map((m) => {
                  const { largo, incluido } = seleccion[m.id]
                  return (
                    <div key={m.id} className="min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-display text-[19px] font-semibold text-brand-dark">
                          {m.nombre}
                        </h3>
                        <span className="font-display text-[17px] text-brand-gold">
                          {incluido ? formatearPesos(precioModulo(linea, m.id, largo)) : '—'}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
                        {m.detalle}
                      </p>

                      <div className="mt-3.5 flex flex-wrap items-center gap-3">
                        <div
                          className={`flex items-center rounded border transition-all ${
                            incluido
                              ? 'border-brand-dark'
                              : 'border-brand-border opacity-50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => ajustarLargo(m.id, largo - LARGO_PASO)}
                            disabled={incluido && largo <= LARGO_MIN}
                            aria-label={`Restar 10 cm a ${m.nombre}`}
                            className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
                          >
                            −
                          </button>
                          <output
                            aria-live="polite"
                            className="min-w-[4.5rem] text-center text-[14px] font-semibold tabular-nums text-brand-dark"
                          >
                            {metros(largo)} m
                          </output>
                          <button
                            type="button"
                            onClick={() => ajustarLargo(m.id, largo + LARGO_PASO)}
                            disabled={incluido && largo >= LARGO_MAX}
                            aria-label={`Sumar 10 cm a ${m.nombre}`}
                            className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => alternarModulo(m.id)}
                          aria-pressed={!incluido}
                          className={`rounded border px-3 py-2 text-[13px] font-medium transition-all ${
                            !incluido
                              ? 'border-brand-dark bg-brand-dark text-white'
                              : 'border-brand-border text-brand-muted hover:border-brand-dark/40 hover:text-brand-dark'
                          }`}
                        >
                          No lo llevo
                        </button>
                      </div>

                      <input
                        type="range"
                        min={LARGO_MIN}
                        max={LARGO_MAX}
                        step={LARGO_PASO}
                        value={largo}
                        onChange={(e) => ajustarLargo(m.id, Number(e.target.value))}
                        aria-label={`Largo de ${m.nombre} en centímetros`}
                        className={`mt-3 w-full accent-brand-dark ${incluido ? '' : 'opacity-40'}`}
                      />
                      <div className="flex justify-between text-[11px] tabular-nums text-brand-muted">
                        <span>{metros(LARGO_MIN)} m</span>
                        <span>{metros(LARGO_MAX)} m</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Resumen ───────────────────────────────────────────── */}
          <div className="min-w-0 bg-brand-dark p-6 text-white sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
              3 · Tu presupuesto
            </p>

            <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
              {items.length === 0 ? (
                <p className="text-[13.5px] leading-relaxed text-brand-muted-dark">
                  Elegí al menos un módulo y su medida para ver el total.
                </p>
              ) : (
                items.map((i) => (
                  <div key={i.id} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-[13.5px] text-brand-muted-dark">
                      {i.nombre}{' '}
                      <span className="tabular-nums text-white/50">{i.medida} m</span>
                    </span>
                    <span className="flex-shrink-0 text-[13.5px] tabular-nums">
                      {formatearPesos(i.precio)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6">
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-muted-dark">
                Total orientativo · línea {nombreLinea}
              </span>
              <p className="mt-2 font-display text-[2.5rem] leading-none tabular-nums text-brand-gold">
                {formatearPesos(total)}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-brand-muted-dark">
                {NOTA_COLOCACION[linea]}. Precios de lista actualizados a{' '}
                {PRECIOS_ACTUALIZADOS}, en pesos. Los trabajos en L se cotizan aparte.
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
