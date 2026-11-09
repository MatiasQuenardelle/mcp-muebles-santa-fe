import { NextResponse } from 'next/server'
import { InputError } from '@/lib/gestion/entrada'

export function responderError(error: unknown, accion: string) {
  if (error instanceof InputError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  console.error(`No se pudo ${accion}`, error)
  return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
}
