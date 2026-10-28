'use client'

import { useState } from 'react'
import { getAttribution } from '@/lib/attribution'
import { trackPresupuestoPdf } from '@/lib/useWhatsAppCTA'
import type { LineaId, ModuloId } from './data'

/**
 * Descarga del presupuesto en PDF a cambio de nombre y WhatsApp. El visitante
 * entra como contacto en el panel de Marcelo (ver /api/presupuesto). Va debajo
 * del botón de WhatsApp, que sigue siendo la acción principal.
 */
export default function DescargaPdf({
  linea,
  seleccion,
  disabled,
}: {
  linea: LineaId
  seleccion: Record<ModuloId, { largo: number; incluido: boolean }>
  disabled: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const response = await fetch('/api/presupuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          empresa,
          linea,
          seleccion,
          page: window.location.pathname,
          attribution: getAttribution(),
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!response.ok || !data.id) {
        setError(data.error ?? 'No se pudo generar. Probá de nuevo.')
        setEnviando(false)
        return
      }
      trackPresupuestoPdf('cocinas_calculadora_pdf')
      // En la misma pestaña: después de un await los navegadores bloquean
      // window.open, y los de Instagram/WhatsApp muestran el PDF así.
      window.location.assign(`/api/presupuesto/${data.id}/pdf`)
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={disabled}
        className="mt-3 w-full rounded-md border border-white/25 px-5 py-3.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:border-brand-gold hover:text-brand-gold disabled:opacity-40"
      >
        Descargar presupuesto en PDF
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-md border border-white/15 p-4">
      <p className="text-[12.5px] leading-relaxed text-brand-muted-dark">
        Dejanos tu nombre y WhatsApp y te descargás el presupuesto con el detalle, lo que incluye y
        la forma de pago.
      </p>
      <label className="mt-3 block">
        <span className="text-[11px] uppercase tracking-[0.14em] text-brand-muted-dark">Nombre</span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoComplete="name"
          className="mt-1 w-full rounded border border-white/20 bg-white/5 px-3 py-2.5 text-base text-white outline-none focus:border-brand-gold"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-[11px] uppercase tracking-[0.14em] text-brand-muted-dark">
          WhatsApp
        </span>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="342 123 4567"
          className="mt-1 w-full rounded border border-white/20 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-brand-gold"
        />
      </label>
      {/* Campo trampa para bots: fuera de pantalla y fuera del orden de tabulación. */}
      <input
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        name="empresa"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      {error ? <p className="mt-3 text-[12.5px] text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={enviando || disabled}
        className="mt-4 w-full rounded-md bg-white px-5 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand-dark transition-all hover:bg-brand-gold-light disabled:opacity-50"
      >
        {enviando ? 'Generando…' : 'Descargar PDF'}
      </button>
      <p className="mt-2 text-center text-[11px] text-brand-muted-dark">
        Marcelo te escribe para ajustar las medidas. Sin spam.
      </p>
    </form>
  )
}
