// Validación del cuerpo de los requests del panel. Server-only, pero sin lib/db:
// solo traduce JSON a los campos que acepta updateConversation / createManualLead.

import { isLeadSource } from '@/lib/crm'
import type { EditableFields } from '@/lib/db'
import { SECCIONES, type Item, type PresupuestoData } from '@/lib/presupuesto'

export class InputError extends Error {}

const TEXT_LIMITS = {
  name: 120,
  phone: 40,
  email: 160,
  zona: 120,
  project: 500,
  follow_up_note: 300,
  lost_reason: 300,
} as const

type TextField = keyof typeof TEXT_LIMITS

// Vacío y null significan lo mismo: "borrar el dato".
function text(value: unknown, field: TextField): string | null {
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new InputError(`Campo inválido: ${field}.`)
  }
  const trimmed = value.trim().slice(0, TEXT_LIMITS[field])
  return trimmed || null
}

export function parseAmount(value: unknown): number | null {
  if (value === null || value === '') {
    return null
  }
  // Se tipea a la argentina: "1.500.000" o "$ 1.500.000,50". Los puntos son
  // separadores de miles y la coma, la de decimales.
  const amount =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^\d,]/g, '').replace(',', '.'))
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) {
    throw new InputError('Monto inválido.')
  }
  return Math.round(amount * 100) / 100
}

export function parseDate(value: unknown): string | null {
  if (value === null || value === '') {
    return null
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InputError('Fecha inválida.')
  }
  return value
}

/** Toma solo las keys presentes: una key ausente no se toca en la base. */
export function parseEditableFields(input: Record<string, unknown>): EditableFields {
  const fields: EditableFields = {}

  for (const field of Object.keys(TEXT_LIMITS) as TextField[]) {
    if (input[field] !== undefined) {
      fields[field] = text(input[field], field)
    }
  }
  if (input.source !== undefined) {
    if (!isLeadSource(input.source)) {
      throw new InputError('Origen inválido.')
    }
    fields.source = input.source
  }
  if (input.amount !== undefined) {
    fields.amount = parseAmount(input.amount)
  }
  if (input.follow_up_on !== undefined) {
    fields.follow_up_on = parseDate(input.follow_up_on)
  }
  if (input.notes !== undefined) {
    if (typeof input.notes !== 'string') {
      throw new InputError('Notas inválidas.')
    }
    fields.notes = input.notes.slice(0, 4000)
  }

  return fields
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

const MAX_ITEMS_POR_SECCION = 40

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function plain(value: unknown, max: number, field: string, required = false): string {
  if (value === undefined || value === null) {
    value = ''
  }
  if (typeof value !== 'string') {
    throw new InputError(`Campo inválido: ${field}.`)
  }
  const trimmed = value.trim().slice(0, max)
  if (required && !trimmed) {
    throw new InputError(`Falta ${field}.`)
  }
  return trimmed
}

function numero(value: unknown, max: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new InputError(`Número inválido en ${field}.`)
  }
  return Math.round(value * 100) / 100
}

/** Valida el presupuesto que manda el editor. Las cuatro fases salen siempre en orden. */
export function parsePresupuestoData(value: unknown): PresupuestoData {
  if (!isRecord(value) || !Array.isArray(value.secciones)) {
    throw new InputError('Presupuesto inválido.')
  }
  const fecha = parseDate(value.fecha)
  if (!fecha) {
    throw new InputError('Falta la fecha.')
  }
  const validez = numero(value.validezDias, 365, 'validez')
  const recibidas = value.secciones.filter(isRecord)

  return {
    cliente: plain(value.cliente, 120, 'el nombre del cliente', true),
    localidad: plain(value.localidad, 120, 'localidad'),
    proyecto: plain(value.proyecto, 200, 'proyecto'),
    fecha,
    validezDias: Math.round(validez),
    entrega: plain(value.entrega, 120, 'término de entrega'),
    garantia: plain(value.garantia, 60, 'garantía'),
    secciones: SECCIONES.map(({ id, titulo }) => {
      const items = recibidas.find((seccion) => seccion.id === id)?.items
      if (items !== undefined && !Array.isArray(items)) {
        throw new InputError(`Renglones inválidos en ${titulo}.`)
      }
      return {
        id,
        items: (items ?? [])
          .slice(0, MAX_ITEMS_POR_SECCION)
          .filter(isRecord)
          .map(
            (item): Item => ({
              concepto: plain(item.concepto, 160, `un concepto de ${titulo}`),
              cantidad: numero(item.cantidad, 1e6, titulo),
              precio: numero(item.precio, 1e10, titulo),
            })
          )
          // Un renglón sin concepto es uno que se agregó y quedó vacío.
          .filter((item) => item.concepto !== ''),
      }
    }),
  }
}
