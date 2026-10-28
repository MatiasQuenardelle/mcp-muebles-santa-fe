// Tipos y constantes del CRM compartidos entre servidor y cliente.
// Este módulo NO puede importar lib/db: los componentes cliente lo usan y se
// llevarían el driver de Postgres al bundle del navegador.

// El orden es el del embudo: así se dibujan las columnas y el selector.
export type ConversationStatus =
  | 'nuevo'
  | 'contactado'
  | 'visita'
  | 'presupuestado'
  | 'ganado'
  | 'perdido'

export const CONVERSATION_STATUSES: ConversationStatus[] = [
  'nuevo',
  'contactado',
  'visita',
  'presupuestado',
  'ganado',
  'perdido',
]

// Estados en los que el contacto ya no necesita seguimiento.
export const CLOSED_STATUSES: ConversationStatus[] = ['ganado', 'perdido']

export function isConversationStatus(value: unknown): value is ConversationStatus {
  return CONVERSATION_STATUSES.includes(value as ConversationStatus)
}

// Por dónde llegó el contacto. 'chat' es el asistente de la web y 'calculadora'
// el PDF de /cocinas; el resto se carga a mano desde el panel.
export type LeadSource =
  | 'chat'
  | 'calculadora'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'telefono'
  | 'local'
  | 'referido'
  | 'otro'

export const LEAD_SOURCES: LeadSource[] = [
  'chat',
  'calculadora',
  'whatsapp',
  'instagram',
  'facebook',
  'telefono',
  'local',
  'referido',
  'otro',
]

// Los que se pueden elegir al cargar a mano: los de la web entran solos.
export const MANUAL_LEAD_SOURCES: LeadSource[] = LEAD_SOURCES.filter(
  (source) => source !== 'chat' && source !== 'calculadora'
)

export const SOURCE_LABELS: Record<LeadSource, string> = {
  chat: 'Chat de la web',
  calculadora: 'Calculadora web',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  telefono: 'Llamada',
  local: 'Vino al local',
  referido: 'Recomendación',
  otro: 'Otro',
}

export function isLeadSource(value: unknown): value is LeadSource {
  return LEAD_SOURCES.includes(value as LeadSource)
}

export type ActivityKind =
  | 'nota'
  | 'llamada'
  | 'whatsapp'
  | 'visita'
  | 'presupuesto'
  | 'estado'
  | 'alta'
  | 'asignacion'

// Las que se cargan a mano. 'estado', 'alta' y 'asignacion' las registra el sistema.
export const MANUAL_ACTIVITY_KINDS: ActivityKind[] = [
  'nota',
  'llamada',
  'whatsapp',
  'visita',
  'presupuesto',
]

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  nota: 'Nota',
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  visita: 'Visita / medición',
  presupuesto: 'Presupuesto enviado',
  estado: 'Cambio de estado',
  alta: 'Contacto cargado',
  asignacion: 'Responsable',
}

export function isManualActivityKind(value: unknown): value is ActivityKind {
  return MANUAL_ACTIVITY_KINDS.includes(value as ActivityKind)
}

// Filtros de la lista del panel. Viajan por `?f=` en la URL.
export type ConversationFilter =
  | 'todas'
  | 'no_leidas'
  | 'pendientes'
  | 'seguimiento'
  | 'calientes'
  | 'con_telefono'
  | 'mios'
  | 'sin_asignar'

export const CONVERSATION_FILTERS: ConversationFilter[] = [
  'todas',
  'mios',
  'sin_asignar',
  'no_leidas',
  'pendientes',
  'seguimiento',
  'calientes',
  'con_telefono',
]

export const FILTER_LABELS: Record<ConversationFilter, string> = {
  todas: 'Todas',
  no_leidas: 'No leídas',
  pendientes: 'Sin contactar',
  seguimiento: 'Seguimiento hoy',
  calientes: 'Calientes',
  con_telefono: 'Con teléfono',
  mios: 'Míos',
  sin_asignar: 'Sin asignar',
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
