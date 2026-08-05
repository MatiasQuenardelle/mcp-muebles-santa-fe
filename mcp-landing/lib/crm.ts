// Tipos y constantes del CRM compartidos entre servidor y cliente.
// Este módulo NO puede importar lib/db: los componentes cliente lo usan y se
// llevarían el driver de Postgres al bundle del navegador.

export type ConversationStatus =
  | 'nuevo'
  | 'contactado'
  | 'presupuestado'
  | 'ganado'
  | 'perdido'

export const CONVERSATION_STATUSES: ConversationStatus[] = [
  'nuevo',
  'contactado',
  'presupuestado',
  'ganado',
  'perdido',
]

// Filtros de la lista del panel. Viajan por `?f=` en la URL.
export type ConversationFilter =
  | 'todas'
  | 'no_leidas'
  | 'pendientes'
  | 'calientes'
  | 'con_telefono'

export const CONVERSATION_FILTERS: ConversationFilter[] = [
  'todas',
  'no_leidas',
  'pendientes',
  'calientes',
  'con_telefono',
]

export const FILTER_LABELS: Record<ConversationFilter, string> = {
  todas: 'Todas',
  no_leidas: 'No leídas',
  pendientes: 'Sin contactar',
  calientes: 'Calientes',
  con_telefono: 'Con teléfono',
}

export function parseFilter(value: string | undefined): ConversationFilter {
  return CONVERSATION_FILTERS.includes(value as ConversationFilter)
    ? (value as ConversationFilter)
    : 'todas'
}

export type Temperature = 'caliente' | 'tibio' | 'frio'

export interface ContactCard {
  nombre: string | null
  telefono: string | null
  email: string | null
  tipo_proyecto: string | null
  medidas: string | null
  linea_interes: string | null
  presupuesto_mencionado: string | null
  zona: string | null
  plazo: string | null
  temperatura: Temperature
  resumen: string
  objeciones: string | null
  proximo_paso: string | null
}
