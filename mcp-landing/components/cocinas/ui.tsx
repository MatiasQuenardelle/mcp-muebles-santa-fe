import type { ReactNode } from 'react'

/** Etiqueta de sección: regla dorada + texto espaciado en mayúsculas. */
export function Eyebrow({
  children,
  tono = 'claro',
  centrado = false,
}: {
  children: ReactNode
  tono?: 'claro' | 'oscuro'
  centrado?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 ${centrado ? 'justify-center' : ''}`}
    >
      <span className="h-px w-8 bg-brand-gold" />
      <span
        className={`text-[11px] font-medium uppercase tracking-[0.22em] ${
          tono === 'claro' ? 'text-brand-gold' : 'text-brand-gold-light'
        }`}
      >
        {children}
      </span>
      {centrado ? <span className="h-px w-8 bg-brand-gold" /> : null}
    </div>
  )
}

/**
 * Titular de dos tiempos: la primera parte en redonda y la segunda en itálica
 * dorada, que es la firma visual de toda la página.
 */
export function Titulo({
  recta,
  italica,
  tono = 'claro',
  centrado = false,
  className = '',
  as: Tag = 'h2',
}: {
  recta: string
  italica?: string
  tono?: 'claro' | 'oscuro'
  centrado?: boolean
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <Tag
      className={`font-display font-semibold leading-[1.12] tracking-[-0.015em] ${
        tono === 'claro' ? 'text-brand-dark' : 'text-white'
      } ${centrado ? 'text-center' : ''} ${className}`}
    >
      <span className="block">{recta}</span>
      {italica ? (
        <span className="block italic text-brand-gold">{italica}</span>
      ) : null}
    </Tag>
  )
}

const baseBoton =
  'inline-flex items-center justify-center gap-2 rounded-md text-[13px] font-bold uppercase tracking-[0.08em] transition-all duration-200'

export function BotonOro({
  children,
  href,
  onClick,
  className = '',
  target,
}: {
  children: ReactNode
  href: string
  onClick?: () => void
  className?: string
  target?: string
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`${baseBoton} bg-brand-gold px-7 py-4 text-brand-dark hover:bg-brand-gold-light hover:shadow-glow-gold ${className}`}
    >
      {children}
    </a>
  )
}

export function BotonFantasma({
  children,
  href,
  onClick,
  tono = 'oscuro',
  className = '',
  target,
}: {
  children: ReactNode
  href: string
  onClick?: () => void
  tono?: 'claro' | 'oscuro'
  className?: string
  target?: string
}) {
  const colores =
    tono === 'oscuro'
      ? 'border-white/25 text-white hover:border-brand-gold hover:text-brand-gold'
      : 'border-brand-dark/20 text-brand-dark hover:border-brand-gold hover:text-brand-gold'

  return (
    <a
      href={href}
      onClick={onClick}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`${baseBoton} border px-7 py-4 ${colores} ${className}`}
    >
      {children}
    </a>
  )
}

export function IconoWhatsApp({ size = 17 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function Check({ tono = 'claro' }: { tono?: 'claro' | 'oscuro' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
        tono === 'claro' ? 'text-brand-gold' : 'text-brand-gold-light'
      }`}
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Cruz() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-muted/50"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.3 5.3a1 1 0 011.4 0L10 8.59l3.3-3.3a1 1 0 111.4 1.42L11.41 10l3.3 3.3a1 1 0 01-1.42 1.4L10 11.41l-3.3 3.3a1 1 0 01-1.4-1.42L8.59 10l-3.3-3.3a1 1 0 010-1.4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Estrellas() {
  return (
    <div className="flex gap-0.5 text-brand-gold" aria-label="5 de 5">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function formatearPesos(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`
}
