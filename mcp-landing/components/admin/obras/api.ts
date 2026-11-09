// Aparte de `send` porque el alta necesita el id para ir a la ficha de la obra.
export async function crearObraRequest(
  cuerpo: Record<string, unknown>
): Promise<{ id: string } | { error: string }> {
  try {
    const respuesta = await fetch('/api/admin/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
    const dato = (await respuesta.json().catch(() => ({}))) as { id?: string; error?: string }
    return respuesta.ok && dato.id ? { id: dato.id } : { error: dato.error ?? 'No se pudo guardar.' }
  } catch {
    return { error: 'No se pudo conectar. Probá de nuevo.' }
  }
}
