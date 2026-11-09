import { NextResponse } from 'next/server'
import { InputError, parseUuid } from '@/lib/gestion/entrada'
import { ObraInexistente } from '@/lib/gestion/obras'

export function idDeObra(id: string): string {
  return parseUuid(id, 'Obra')
}

export function respuestaDeError(error: unknown, contexto: string): NextResponse {
  if (error instanceof InputError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (error instanceof ObraInexistente) {
    return NextResponse.json({ error: 'No se encontró esa obra.' }, { status: 404 })
  }
  console.error(contexto, error)
  return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
}
