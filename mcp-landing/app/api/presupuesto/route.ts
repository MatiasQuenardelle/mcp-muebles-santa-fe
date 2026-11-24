import { NextResponse } from 'next/server'
import { cotizar, leerSeleccion } from '@/components/cocinas/cotizar'
import { LINEAS, NOTA_COLOCACION, PRECIOS_ACTUALIZADOS } from '@/components/cocinas/data'
import { todayKey } from '@/lib/adminFormat'
import {
  MAX_CALCULATOR_LEADS_PER_HOUR,
  clientIp,
  countRecentCalculatorLeads,
  createCalculatorLead,
  createPresupuesto,
  hashIp,
  isDatabaseConfigured,
} from '@/lib/db'
import { notifyPhoneLead } from '@/lib/notify'
import { pesos, type PreliminarData } from '@/lib/presupuesto'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * PDF preliminar de la calculadora de /cocinas. El visitante deja nombre y
 * WhatsApp, entra como contacto 'calculadora' en el panel y se le devuelve el id
 * para descargar el PDF. Los precios se recalculan acá con la lista de
 * components/cocinas/cotizar.ts: nunca se confía en el total del navegador.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'No disponible.' }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as unknown
  if (!isRecord(body) || !isRecord(body.seleccion)) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  // Campo trampa: invisible para una persona, los bots lo completan.
  if (typeof body.empresa === 'string' && body.empresa.trim()) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim().slice(0, 80) : ''
  const telefono = typeof body.telefono === 'string' ? body.telefono.trim().slice(0, 40) : ''
  const digitos = telefono.replace(/\D/g, '').length
  if (nombre.length < 2) {
    return NextResponse.json({ error: 'Poné tu nombre.' }, { status: 400 })
  }
  if (digitos < 8 || digitos > 15) {
    return NextResponse.json({ error: 'Revisá el número de WhatsApp.' }, { status: 400 })
  }

  const seleccion = leerSeleccion(body.seleccion)
  const linea = seleccion && LINEAS.find((l) => l.id === seleccion.linea)
  if (!seleccion || !linea) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  if (!seleccion.bajoMesada.incluido && !seleccion.alacena.incluido && !seleccion.mesada.incluido) {
    return NextResponse.json({ error: 'Elegí al menos un módulo.' }, { status: 400 })
  }
  const { renglones: modulos, total, aConsultar } = cotizar(seleccion)

  const ipHash = await hashIp(clientIp(request))
  if (ipHash && (await countRecentCalculatorLeads(ipHash)) >= MAX_CALCULATOR_LEADS_PER_HOUR) {
    return NextResponse.json(
      { error: 'Ya generaste varios presupuestos. Escribinos por WhatsApp y lo vemos juntos.' },
      { status: 429 }
    )
  }

  const detalle = modulos
    .filter((m) => !m.nota || m.nota === 'A consultar')
    .map((m) => `${m.nombre} ${m.medida}`)
    .join(' + ')
  const page = typeof body.page === 'string' ? body.page.slice(0, 200) : '/cocinas'
  const attribution = isRecord(body.attribution) ? body.attribution : null
  const data: PreliminarData = {
    cliente: nombre,
    fecha: todayKey(),
    validezDias: 10,
    linea: linea.nombre,
    incluye: linea.incluye,
    conColocacion: linea.id !== 'economica',
    notaColocacion: NOTA_COLOCACION[linea.id],
    preciosActualizados: PRECIOS_ACTUALIZADOS,
    modulos,
    total,
  }

  try {
    const conversationId = await createCalculatorLead({
      name: nombre,
      phone: telefono,
      project: `Cocina línea ${linea.nombre}: ${detalle}`,
      amount: total,
      page,
      attribution,
      userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
      ipHash,
    })
    const { id } = await createPresupuesto({
      conversationId,
      kind: 'preliminar',
      data,
      total,
      userId: null,
    })
    // Con `await`: Vercel congela la lambda apenas responde.
    await notifyPhoneLead({
      conversationId,
      name: nombre,
      phone: telefono,
      message: `Línea ${linea.nombre}: ${detalle} · ${pesos(total)}${aConsultar ? ' + mesada a consultar' : ''}`,
      page,
      attribution,
      headline: '🧮 Bajaron el presupuesto en PDF de la calculadora',
    })
    return NextResponse.json({ id })
  } catch (error) {
    console.error('No se pudo generar el presupuesto preliminar', error)
    return NextResponse.json({ error: 'No se pudo generar. Probá de nuevo.' }, { status: 500 })
  }
}
