// Piezas visuales comunes de las pantallas de gestión. Sin estado: sirven tanto en
// server components como en cliente. text-base en los campos: con menos de 16px el
// iPhone hace zoom al enfocar.

import type { ReactNode } from 'react'

export const CLASE_ETIQUETA = 'block text-[11px] uppercase tracking-wide text-brand-muted mb-1'
export const CLASE_INPUT =
  'w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-base focus:outline-none focus:border-brand-gold disabled:bg-brand-card'
export const CLASE_SELECT = 'w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-base'
export const CLASE_BOTON = 'w-full rounded-xl bg-brand-dark text-brand-gold font-semibold py-3 disabled:opacity-40'
export const CLASE_BOTON_SECUNDARIO =
  'rounded-full border border-brand-border bg-white text-brand-dark text-xs font-semibold px-3 py-1.5 disabled:opacity-40'
export const CLASE_BOTON_PILL =
  'rounded-full bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-1.5 disabled:opacity-40'
export const CLASE_CHIP_ACTIVO = 'bg-brand-dark text-brand-gold border-brand-dark'
export const CLASE_CHIP_INACTIVO = 'bg-white text-brand-muted border-brand-border'
export const CLASE_ERROR = 'text-sm text-red-700'

export function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold text-brand-dark">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-brand-muted">{children}</p>
}

export function Tile({
  label,
  value,
  hint,
  tono = 'normal',
}: {
  label: string
  value: string
  hint?: string
  tono?: 'normal' | 'alerta'
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 min-w-0 ${
        tono === 'alerta' ? 'border-red-200 bg-red-50' : 'border-brand-border bg-brand-cream'
      }`}
      title={hint}
    >
      <div
        className={`text-lg font-semibold tabular-nums leading-tight truncate ${
          tono === 'alerta' ? 'text-red-700' : 'text-brand-dark'
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-brand-muted leading-tight">{label}</div>
    </div>
  )
}

// Barra de una sola serie, con el valor siempre escrito al lado: el color no lleva
// información por sí solo.
export function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-2 rounded-full bg-brand-card overflow-hidden">
      <span
        className="block h-full rounded-full bg-brand-gold"
        style={{ width: `${value === 0 || max === 0 ? 0 : Math.max(4, (value / max) * 100)}%` }}
      />
    </span>
  )
}

export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className={CLASE_ETIQUETA}>{label}</span>
      {children}
    </label>
  )
}
