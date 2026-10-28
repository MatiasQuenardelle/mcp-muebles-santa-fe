// Client-side: llamadas del panel a /api/admin/*. Devuelven el mensaje de error
// del server (o uno genérico) para mostrarlo tal cual, o null si salió bien.

async function send(method: string, url: string, body?: unknown): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Para que el registro de "abrí WhatsApp" llegue aunque la pestaña se vaya.
      keepalive: true,
    })
    if (response.ok) {
      return null
    }
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    return data.error ?? 'No se pudo guardar.'
  } catch {
    return 'No se pudo conectar. Probá de nuevo.'
  }
}

export function patchConversation(id: string, body: Record<string, unknown>) {
  return send('PATCH', `/api/admin/conversations/${id}`, body)
}

export function deleteConversationRequest(id: string) {
  return send('DELETE', `/api/admin/conversations/${id}`)
}

export function postActivity(id: string, kind: string, body: string | null) {
  return send('POST', `/api/admin/conversations/${id}/activities`, { kind, body })
}

export function deleteActivityRequest(id: string, activityId: number) {
  return send('DELETE', `/api/admin/conversations/${id}/activities`, { activityId })
}

/** Crea un presupuesto formal. Devuelve el id nuevo, o el mensaje de error. */
export async function createPresupuestoRequest(
  conversationId: string,
  data: unknown
): Promise<{ id: string } | { error: string }> {
  try {
    const response = await fetch('/api/admin/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, data }),
    })
    const body = (await response.json().catch(() => ({}))) as { id?: string; error?: string }
    return response.ok && body.id ? { id: body.id } : { error: body.error ?? 'No se pudo guardar.' }
  } catch {
    return { error: 'No se pudo conectar. Probá de nuevo.' }
  }
}

export function patchPresupuesto(id: string, body: { data?: unknown; marcarEnviado?: boolean }) {
  return send('PATCH', `/api/admin/presupuestos/${id}`, body)
}

export function deletePresupuestoRequest(id: string) {
  return send('DELETE', `/api/admin/presupuestos/${id}`)
}
