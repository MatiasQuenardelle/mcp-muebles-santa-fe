// Reglas del bot sin base ni red. Corren con `npm test`.

export const MODOS_BOT = ['OFF', 'SUGGEST', 'AUTO'] as const
export type ModoBot = (typeof MODOS_BOT)[number]

export const ETIQUETAS_MODO: Record<ModoBot, string> = {
  OFF: 'Apagado',
  SUGGEST: 'Solo sugerencias',
  AUTO: 'Automático',
}

export function esModoBot(value: unknown): value is ModoBot {
  return MODOS_BOT.includes(value as ModoBot)
}

export function modoEfectivo(general: ModoBot, override: ModoBot | null): ModoBot {
  return override ?? general
}

const VENTANA_MS = 24 * 3_600_000

export function ventanaAbierta(ultimoEntrante: string | Date | null, ahora: number): boolean {
  if (!ultimoEntrante) {
    return false
  }
  return ahora - new Date(ultimoEntrante).getTime() < VENTANA_MS
}

// Con un umbral más bajo se cortaría a clientes reales: es normal mandar varios
// mensajes seguidos por WhatsApp. Esto apunta a otro bot contestando en bucle.
export const BUCLE_VENTANA_SEGUNDOS = 120
export const BUCLE_UMBRAL = 10

export function hayBucle(entrantesRecientes: number): boolean {
  return entrantesRecientes >= BUCLE_UMBRAL
}
