'use client'

import { useMemo, useState } from 'react'
import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'
import {
  DESCUENTO_ECONOMICA,
  LINEAS,
  MEDIDAS,
  MODULOS,
  PRECIOS_ACTUALIZADOS,
  precioModulo,
  type LineaId,
  type ModuloId,
} from './data'
import { Eyebrow, IconoWhatsApp, Titulo, formatearPesos } from './ui'

/** −1 = ese módulo no entra en el presupuesto. */
type Seleccion = Record<ModuloId, number>

const SELECCION_INICIAL: Seleccion = { bajoMesada: 2, alacena: 2, mesada: -1 }

const NOTA_COLOCACION: Record<LineaId, string> = {
  economica: 'Sin colocación · entrega a domicilio',
  estandar: 'Colocación a convenir, se cotiza aparte',
  premium: 'Colocación profesional incluida',
}

export default function Calculadora() {
  const [linea, setLinea] = useState<LineaId>('estandar')
  const [seleccion, setSeleccion] = useState<Seleccion>(SELECCION_INICIAL)

  const items = useMemo(
    () =>
      MODULOS.filter((m) => seleccion[m.id] >= 0).map((m) => ({
        id: m.id,
        nombre: m.nombre,
        medida: MEDIDAS[seleccion[m.id]],
        precio: precioModulo(linea, m.id, seleccion[m.id]),
      })),
    [linea, seleccion]
  )

  const subtotal = items.reduce((acc, i) => acc + i.precio, 0)
  const descuento = linea === 'economica' && subtotal > 0 ? DESCUENTO_ECONOMICA : 0
  const total = Math.max(subtotal - descuento, 0)
  const nombreLinea = LINEAS.find((l) => l.id === linea)?.nombre ?? ''

  const mensaje = useMemo(() => {
    if (items.length === 0) {
      return 'Hola Marcelo, quiero armar el presupuesto de mi cocina a medida.'
    }
    const detalle = items
      .map((i) => `· ${i.nombre} ${i.medida} m — ${formatearPesos(i.precio)}`)
      .join('\n')
    const lineaDescuento = descuento
      ? `\n· Descuento línea Económica — −${formatearPesos(descuento)}`
      : ''
    return [
      `Hola Marcelo, armé este presupuesto en la calculadora de la web (línea ${nombreLinea}):`,
      `${detalle}${lineaDescuento}`,
      `Total orientativo: ${formatearPesos(total)}`,
      '¿Me confirmás el precio exacto para mis medidas?',
    ].join('\n\n')
  }, [items, descuento, nombreLinea, total])

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
            Elegí la línea, sumá los módulos que necesitás y la calculadora te da el número
            con la lista de precios de MCP. Es orientativo: el precio final sale del
            relevamiento de tu espacio, pero te deja saber en qué rango estás parado.
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
                2 · Sumá los módulos
              </p>

              <div className="mt-5 space-y-7">
                {MODULOS.map((m) => {
                  const index = seleccion[m.id]
                  return (
                    <div key={m.id} className="min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-display text-[19px] font-semibold text-brand-dark">
                          {m.nombre}
                        </h3>
                        <span className="font-display text-[17px] text-brand-gold">
                          {index >= 0 ? formatearPesos(precioModulo(linea, m.id, index)) : '—'}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
                        {m.detalle}
                      </p>

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {MEDIDAS.map((medida, i) => {
                          const activa = index === i
                          return (
                            <button
                              key={medida}
                              type="button"
                              onClick={() =>
                                setSeleccion((s) => ({ ...s, [m.id]: activa ? -1 : i }))
                              }
                              aria-pressed={activa}
                              className={`rounded border px-3 py-2 text-[13px] font-medium tabular-nums transition-all ${
                                activa
                                  ? 'border-brand-dark bg-brand-dark text-white'
                                  : 'border-brand-border text-brand-muted hover:border-brand-dark/40 hover:text-brand-dark'
                              }`}
                            >
                              {medida} m
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => setSeleccion((s) => ({ ...s, [m.id]: -1 }))}
                          aria-pressed={index === -1}
                          className={`rounded border px-3 py-2 text-[13px] font-medium transition-all ${
                            index === -1
                              ? 'border-brand-dark bg-brand-dark text-white'
                              : 'border-brand-border text-brand-muted hover:border-brand-dark/40 hover:text-brand-dark'
                          }`}
                        >
                          No lo llevo
                        </button>
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

              {descuento > 0 ? (
                <div className="flex items-baseline justify-between gap-3 text-brand-gold">
                  <span className="text-[13.5px]">Descuento línea Económica</span>
                  <span className="flex-shrink-0 text-[13.5px] tabular-nums">
                    −{formatearPesos(descuento)}
                  </span>
                </div>
              ) : null}
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
                {PRECIOS_ACTUALIZADOS}, en pesos. Medidas especiales y trabajos en L se
                cotizan aparte.
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

        {/* Estudio previo */}
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:flex md:items-center md:justify-between md:gap-10">
          <div className="min-w-0">
            <h3 className="font-display text-[21px] font-semibold text-white">
              ¿Querés el número exacto, no el orientativo?
            </h3>
            <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-white/55">
              El estudio previo incluye visita, mediciones precisas, asesoramiento, diseño y
              presupuesto itemizado por escrito. Cuesta{' '}
              <span className="font-semibold text-brand-gold">$40.000</span> y se descuenta
              del total si avanzás. Si no avanzás, te quedás con las medidas exactas y un
              presupuesto profesional para comparar.
            </p>
          </div>
          <EstudioPrevioCTA />
        </div>
      </div>
    </section>
  )
}

function EstudioPrevioCTA() {
  const { href, handleClick } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, quiero coordinar la visita para el presupuesto detallado ($40.000 descontables del total).',
    ctaLabel: 'Coordinar la visita',
    placement: 'cocinas_estudio_previo',
  })

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-md border border-brand-gold px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand-gold transition-all hover:bg-brand-gold hover:text-brand-dark md:mt-0"
    >
      Coordinar la visita
    </a>
  )
}
