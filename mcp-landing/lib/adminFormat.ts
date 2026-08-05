// Helpers de presentación del panel. Server y cliente.

import type { Attribution } from '@/lib/attribution'
import { getOriginLabel } from '@/lib/attribution'
import type { ConversationStatus } from '@/lib/crm'

const TZ = 'America/Argentina/Buenos_Aires'

// La base guarda timestamptz en UTC: sin forzar la zona, todo sale corrido.
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(value: string): string {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60_000)

  if (minutes < 1) return 'recién'
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`

  const days = Math.round(hours / 24)
  if (days < 30) return `hace ${days} d`

  return formatDateTime(value)
}

// Clave de día calendario en Buenos Aires ("2026-08-05"), para agrupar los
// mensajes del thread sin que un mensaje de las 22 h caiga en el día siguiente.
export function dayKey(value: string): string {
  return new Date(value).toLocaleDateString('en-CA', { timeZone: TZ })
}

export function dayLabel(value: string): string {
  const key = dayKey(value)
  const now = Date.now()
  if (key === dayKey(new Date(now).toISOString())) return 'Hoy'
  if (key === dayKey(new Date(now - 86_400_000).toISOString())) return 'Ayer'
  return new Date(value).toLocaleDateString('es-AR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Color estable por nombre, para que cada contacto tenga siempre el mismo avatar.
export function nameToHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export function initials(name: string | null): string | null {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

// La atribución se guarda como jsonb tal cual la manda el cliente.
export function originLabel(attribution: Record<string, unknown> | null): string {
  return getOriginLabel((attribution as Attribution | null) ?? null)
}

export const STATUS_LABELS: Record<ConversationStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  presupuestado: 'Presupuestado',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

export const STATUS_STYLES: Record<ConversationStatus, string> = {
  nuevo: 'bg-brand-gold/15 text-brand-dark border-brand-gold/40',
  contactado: 'bg-blue-50 text-blue-800 border-blue-200',
  presupuestado: 'bg-purple-50 text-purple-800 border-purple-200',
  ganado: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  perdido: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

// Punto de color del dropdown de estado, hermano de STATUS_STYLES.
export const STATUS_DOTS: Record<ConversationStatus, string> = {
  nuevo: 'bg-brand-gold',
  contactado: 'bg-blue-500',
  presupuestado: 'bg-purple-500',
  ganado: 'bg-emerald-500',
  perdido: 'bg-neutral-400',
}

export const TEMPERATURE_LABELS: Record<string, string> = {
  caliente: 'Caliente',
  tibio: 'Tibio',
  frio: 'Frío',
}

export const TEMPERATURE_STYLES: Record<string, string> = {
  caliente: 'bg-red-50 text-red-700 border-red-200',
  tibio: 'bg-amber-50 text-amber-800 border-amber-200',
  frio: 'bg-sky-50 text-sky-800 border-sky-200',
}

// Deja solo dígitos y antepone el país si hace falta, para armar wa.me y tel:.
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('54')) return digits
  if (digits.startsWith('0')) return `54${digits.slice(1)}`
  return `54${digits}`
}
