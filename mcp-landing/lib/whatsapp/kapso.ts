// Server-only: las llamadas a la API de Kapso que usa el panel. Lo que se corre
// una sola vez al conectar el número está en db/kapso-setup.mjs.

import { soloDigitos } from './webhook'

const META_API = 'v21.0'

export class ErrorKapso extends Error {
  constructor(
    readonly status: number,
    detalle: string
  ) {
    super(`Kapso ${status}: ${detalle}`)
  }
}

async function kapso<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = (process.env.KAPSO_API_KEY ?? '').trim()
  if (!apiKey) {
    throw new Error('KAPSO_API_KEY no está configurada')
  }
  const base = (process.env.KAPSO_API_BASE_URL ?? '').trim() || 'https://api.kapso.ai'
  const response = await fetch(`${base}${path}`, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, ...options.headers },
  })
  if (!response.ok) {
    throw new ErrorKapso(response.status, await response.text())
  }
  return response.json() as Promise<T>
}

export async function enviarTexto(
  phoneNumberId: string,
  to: string,
  body: string
): Promise<string | null> {
  const result = await kapso<{ messages?: Array<{ id: string }> }>(
    `/meta/whatsapp/${META_API}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    }
  )
  return result.messages?.[0]?.id ?? null
}

async function conversacionActiva(phoneNumberId: string, phone: string): Promise<string | null> {
  const { data } = await kapso<{ data: Array<{ id: string; phone_number: string }> }>(
    `/platform/v1/whatsapp/conversations?phone_number_id=${phoneNumberId}&status=active&per_page=100`
  )
  const digits = soloDigitos(phone)
  return data.find((item) => soloDigitos(item.phone_number) === digits)?.id ?? null
}

// El bot deja de contestar en esta charla, aunque tuviera una ejecución esperando.
export async function pasarAHumano(phoneNumberId: string, phone: string): Promise<void> {
  const conversationId = await conversacionActiva(phoneNumberId, phone)
  if (!conversationId) {
    return
  }
  const { data } = await kapso<{ data: Array<{ id: string; status: string }> }>(
    `/platform/v1/whatsapp/conversations/${conversationId}/flow_executions`
  )
  const ejecucion = data.find((item) => ['running', 'waiting'].includes(item.status))
  if (ejecucion) {
    await kapso(`/platform/v1/workflow_executions/${ejecucion.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ workflow_execution: { status: 'handoff' } }),
    })
  }
}

// Cierra la charla en Kapso: el próximo mensaje del cliente arranca limpio y
// vuelve a preguntar el modo.
export async function terminarConversacion(phoneNumberId: string, phone: string): Promise<void> {
  const conversationId = await conversacionActiva(phoneNumberId, phone)
  if (conversationId) {
    await kapso(`/platform/v1/whatsapp/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ whatsapp_conversation: { status: 'ended' } }),
    })
  }
}

// El workflow y sus disparadores se prenden y apagan por separado.
export async function activarWorkflow(workflowId: string, activo: boolean): Promise<void> {
  await kapso(`/platform/v1/workflows/${workflowId}`, {
    method: 'PATCH',
    body: JSON.stringify({ workflow: { status: activo ? 'active' : 'draft' } }),
  })
  const { data } = await kapso<{ data: Array<{ id: string; active: boolean }> }>(
    `/platform/v1/workflows/${workflowId}/triggers`
  )
  await Promise.all(
    data
      .filter((trigger) => trigger.active !== activo)
      .map((trigger) =>
        kapso(`/platform/v1/triggers/${trigger.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ trigger: { active: activo } }),
        })
      )
  )
}
