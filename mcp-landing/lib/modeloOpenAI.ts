// Parámetros de generación según la familia del modelo de OpenAI.
// gpt-4o-mini y gpt-5-mini se apagan (14/01/2027 y 11/12/2026, página de
// deprecaciones de OpenAI); el reemplazo es gpt-6-luna.

export const MODELO_OPENAI = 'gpt-6-luna'

/**
 * gpt-4.x/4o aceptan temperature y max_tokens. Los que razonan (gpt-5, gpt-6,
 * o-series) sólo aceptan la temperatura por defecto y piden
 * max_completion_tokens; gpt-6 va con el razonamiento apagado ("none"): ~3-4 s
 * por respuesta en vez de 10-20 s, probado en el asesor de Nubera el 18/11/2026.
 */
export function opcionesDeModelo(modelo: string, opciones: { temperature: number; maxTokens?: number }) {
  const largo = (clave: 'max_tokens' | 'max_completion_tokens') =>
    opciones.maxTokens === undefined ? {} : { [clave]: opciones.maxTokens }
  if (/^gpt-4/.test(modelo.trim())) {
    return { temperature: opciones.temperature, ...largo('max_tokens') }
  }
  return {
    reasoning_effort: /^gpt-6/.test(modelo.trim()) ? 'none' : 'low',
    ...largo('max_completion_tokens'),
  }
}
