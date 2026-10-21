// Helpers de presentación del panel. Server y cliente.

import type { Attribution } from '@/lib/attribution'
import { getOriginLabel } from '@/lib/attribution'
import { SOURCE_LABELS, type ConversationStatus } from '@/lib/crm'
import type { ConversationRow } from '@/lib/db'

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
  visita: 'Visita / medición',
  presupuestado: 'Presupuestado',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

export const STATUS_STYLES: Record<ConversationStatus, string> = {
  nuevo: 'bg-brand-gold/15 text-brand-dark border-brand-gold/40',
  contactado: 'bg-blue-50 text-blue-800 border-blue-200',
  visita: 'bg-teal-50 text-teal-800 border-teal-200',
  presupuestado: 'bg-purple-50 text-purple-800 border-purple-200',
  ganado: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  perdido: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

// Punto de color del dropdown de estado, hermano de STATUS_STYLES.
export const STATUS_DOTS: Record<ConversationStatus, string> = {
  nuevo: 'bg-brand-gold',
  contactado: 'bg-blue-500',
  visita: 'bg-teal-500',
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

// Lo que se muestra de un contacto. Lo editado a mano en el panel manda sobre lo
// que extrajo la tarjeta IA (saveCard ya copia nombre y teléfono a las columnas).
export function contactView(row: ConversationRow) {
  const card = row.card
  return {
    nombre: row.name ?? card?.nombre ?? null,
    telefono: row.phone ?? card?.telefono ?? null,
    email: row.email ?? card?.email ?? null,
    zona: row.zona ?? card?.zona ?? null,
    proyecto: row.project ?? card?.tipo_proyecto ?? null,
  }
}

// De dónde vino: para los chats, la atribución de la visita (Google Ads,
// orgánico, Meta...); para los cargados a mano, el canal que se eligió.
export function leadOrigin(row: Pick<ConversationRow, 'source' | 'attribution'>): string {
  if (row.source && row.source !== 'chat') {
    return SOURCE_LABELS[row.source] ?? row.source
  }
  return `Web · ${originLabel(row.attribution)}`
}

const MONEY = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatMoney(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : MONEY.format(value)
}

// Montos grandes en las tarjetas del embudo: "$ 1,2 M" se lee de un vistazo.
export function formatMoneyShort(value: number): string {
  if (value >= 1_000_000) {
    return `$ ${(value / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  }
  if (value >= 1_000) {
    return `$ ${Math.round(value / 1_000).toLocaleString('es-AR')} mil`
  }
  return MONEY.format(value)
}

// "Hoy" como 'YYYY-MM-DD' en Buenos Aires, el mismo formato que follow_up_on.
export function todayKey(): string {
  return dayKey(new Date().toISOString())
}

export function addDaysKey(days: number): string {
  return dayKey(new Date(Date.now() + days * 86_400_000).toISOString())
}

// Fecha de seguimiento legible y con urgencia: "Vencido hace 2 d", "Hoy", "Mañana", "jue 24/10".
export function followUpLabel(dateKey: string): { label: string; tone: 'overdue' | 'today' | 'future' } {
  const today = todayKey()
  if (dateKey < today) {
    const days = Math.round(
      (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${dateKey}T12:00:00Z`)) / 86_400_000
    )
    return { label: days === 1 ? 'Venció ayer' : `Vencido hace ${days} d`, tone: 'overdue' }
  }
  if (dateKey === today) {
    return { label: 'Hoy', tone: 'today' }
  }
  if (dateKey === addDaysKey(1)) {
    return { label: 'Mañana', tone: 'future' }
  }
  // Mediodía UTC: cualquier zona horaria cae en el mismo día calendario.
  const label = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
  return { label, tone: 'future' }
}

export const FOLLOW_UP_STYLES: Record<'overdue' | 'today' | 'future', string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  today: 'bg-brand-gold/15 text-brand-dark border-brand-gold/50',
  future: 'bg-white text-brand-muted border-brand-border',
}
