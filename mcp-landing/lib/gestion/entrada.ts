// Validación de lo que entra por los formularios de gestión. Más estricta que
// lib/adminInput: acá un monto mal leído termina sumado en la caja. Sin imports en
// runtime, para poder usarlo en el navegador y en los tests.

import type { MovimientoNuevo, TipoMovimiento } from './tipos'

export class InputError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MONTO_MAXIMO = 1e12

// Solo acepta el número ya convertido: el texto se interpreta en el formulario
// con textoAMonto, donde el usuario ve el resultado antes de guardar.
export function parseMonto(valor: unknown, campo = 'Monto'): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > MONTO_MAXIMO) {
    throw new InputError(`${campo}: tiene que ser un número mayor a cero.`)
  }
  return Math.round(valor * 100) / 100
}

/** Igual que parseMonto, pero acepta cero. Para saldos iniciales y precios. */
export function parseMontoOCero(valor: unknown, campo = 'Monto'): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > MONTO_MAXIMO) {
    throw new InputError(`${campo}: tiene que ser un número.`)
  }
  return Math.round(valor * 100) / 100
}

/** Con signo y distinto de cero. Para ajustes de contrato. */
export function parseMontoConSigno(valor: unknown, campo = 'Monto'): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor === 0 || Math.abs(valor) > MONTO_MAXIMO) {
    throw new InputError(`${campo}: tiene que ser un número distinto de cero.`)
  }
  return Math.round(valor * 100) / 100
}

export function parsePorcentaje(valor: unknown, campo = 'Porcentaje'): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 100) {
    throw new InputError(`${campo}: tiene que estar entre 0 y 100.`)
  }
  return Math.round(valor * 100) / 100
}

export function parseCantidad(valor: unknown, campo = 'Cantidad'): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > 1e8) {
    throw new InputError(`${campo}: tiene que ser un número mayor a cero.`)
  }
  return Math.round(valor * 1000) / 1000
}

// Rechaza también el 31 de febrero: el regex solo no alcanza.
export function esFechaReal(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false
  }
  const fecha = new Date(`${valor}T12:00:00Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

export function parseFecha(valor: unknown, campo = 'Fecha'): string {
  if (typeof valor !== 'string' || !esFechaReal(valor)) {
    throw new InputError(`${campo}: la fecha no es válida.`)
  }
  return valor
}

export function parseFechaOpcional(valor: unknown, campo = 'Fecha'): string | null {
  return valor === null || valor === undefined || valor === '' ? null : parseFecha(valor, campo)
}

export function parseUuid(valor: unknown, campo = 'Identificador'): string {
  if (typeof valor !== 'string' || !UUID.test(valor)) {
    throw new InputError(`${campo}: no es válido.`)
  }
  return valor
}

export function parseUuidOpcional(valor: unknown, campo = 'Identificador'): string | null {
  return valor === null || valor === undefined || valor === '' ? null : parseUuid(valor, campo)
}

export function parseTexto(valor: unknown, campo: string, maximo = 300): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new InputError(`Falta completar: ${campo}.`)
  }
  return valor.trim().slice(0, maximo)
}

export function parseTextoOpcional(valor: unknown, maximo = 1000): string | null {
  if (valor === null || valor === undefined) {
    return null
  }
  if (typeof valor !== 'string') {
    throw new InputError('Hay un texto inválido en el formulario.')
  }
  return valor.trim().slice(0, maximo) || null
}

export function parseEnum<T extends string>(valor: unknown, opciones: readonly T[], campo: string): T {
  if (typeof valor !== 'string' || !opciones.includes(valor as T)) {
    throw new InputError(`${campo}: opción inválida.`)
  }
  return valor as T
}

const TIPOS: readonly TipoMovimiento[] = ['ingreso', 'egreso', 'transferencia']

export function parseMovimientoNuevo(cuerpo: unknown): MovimientoNuevo {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    throw new InputError('Pedido inválido.')
  }
  const dato = cuerpo as Record<string, unknown>
  return {
    id: parseUuid(dato.id, 'Identificador del movimiento'),
    fecha: parseFecha(dato.fecha),
    tipo: parseEnum(dato.tipo, TIPOS, 'Tipo de movimiento'),
    monto: parseMonto(dato.monto),
    cuentaId: parseUuid(dato.cuentaId, 'Cuenta'),
    cuentaDestinoId: parseUuidOpcional(dato.cuentaDestinoId, 'Cuenta de destino'),
    categoriaId: parseUuidOpcional(dato.categoriaId, 'Categoría'),
    obraId: parseUuidOpcional(dato.obraId, 'Obra'),
    proveedorId: parseUuidOpcional(dato.proveedorId, 'Proveedor'),
    personalId: parseUuidOpcional(dato.personalId, 'Persona'),
    nota: parseTextoOpcional(dato.nota, 500),
  }
}

// Lo que se tipea en Argentina: "1.500.000", "1500000", "$ 1.500.000,50". Devuelve
// null ante cualquier otra cosa: "12.50" es ambiguo y "abc" no es un número, y en
// los dos casos es mejor pedirlo de nuevo que guardar otro monto.
export function textoAMonto(texto: string): number | null {
  const limpio = texto.replace(/[$\s]/g, '')
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(limpio)) {
    return null
  }
  const valor = Number(limpio.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(valor) ? valor : null
}
