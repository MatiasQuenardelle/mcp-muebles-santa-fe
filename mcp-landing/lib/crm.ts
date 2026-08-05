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
