// Armado del pedido de sugerencia. Sin red: se prueba con `npm test`.

export interface MensajeCharla {
  role: 'user' | 'assistant' | 'human'
  content: string
  created_at: string | Date
}

const HORAS_SEGUIMIENTO = 4
export const MAX_MENSAJES_SUGERENCIA = 30

const AUTOR: Record<MensajeCharla['role'], string> = {
  user: 'Cliente',
  assistant: 'Asistente (IA)',
  human: 'Equipo de MCP',
}

function duracion(ms: number): string {
  const minutos = Math.floor(ms / 60_000)
  if (minutos < 60) return `${Math.max(minutos, 1)} min`
  const horas = Math.floor(minutos / 60)
  return horas < 24 ? `${horas} h` : `${Math.floor(horas / 24)} días`
}

function situacion(mensajes: MensajeCharla[], ahora: number): string {
  const ultimo = mensajes[mensajes.length - 1]
  const hace = ahora - new Date(ultimo.created_at).getTime()
  const tiempo = duracion(hace)

  if (hace < HORAS_SEGUIMIENTO * 3_600_000) {
    return ultimo.role === 'user'
      ? `Charla activa: el cliente escribió hace ${tiempo}. Respondé a su último mensaje.`
      : `Charla activa: el último mensaje fue nuestro, hace ${tiempo}. Sugerí cómo seguir sin repetirlo.`
  }
  return ultimo.role === 'user'
    ? `El cliente escribió hace ${tiempo} y todavía no le contestamos. Retomá su último mensaje; si pasó más de un día, reconocé la demora sin exagerar.`
    : `Seguimiento: nuestro último mensaje fue hace ${tiempo} y el cliente no respondió. Retomá el tema dando contexto, sin presionar y sin actuar como si acabara de escribir.`
}

export function instruccionesSugerencia(mensajes: MensajeCharla[], ahora: number): string {
  return `---
Ahora no le hablás al cliente: redactás el mejor próximo mensaje para que una persona del equipo de MCP lo revise, lo edite si quiere y lo envíe.

${situacion(mensajes, ahora)}

- Un solo mensaje, de 2 o 3 oraciones. Es WhatsApp.
- Usá el nombre del cliente si lo sabés.
- Siempre con voseo argentino (podés, querés, tenés), nunca "puedes" ni "quieres".
- Tiene que sonar a persona. Nada de "Espero que estés bien" ni "Quedo a disposición".
- No repitas frases de mensajes anteriores.
- No hables de Marcelo en tercera persona si el mensaje puede ser suyo.

Respondé SOLO con el texto del mensaje, sin comillas ni explicación.`
}

export function charlaComoTexto(mensajes: MensajeCharla[]): string {
  return mensajes.map((m) => `${AUTOR[m.role]}: ${m.content}`).join('\n')
}
