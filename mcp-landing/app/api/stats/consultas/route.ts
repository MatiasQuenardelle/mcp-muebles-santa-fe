import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { db, isDatabaseConfigured, SITE_ID } from '@/lib/db'

// Consultas reales por día, para el panel de nubera. GA4 cuenta los clics en el
// botón de WhatsApp y la mitad de esa gente nunca escribe; esto cuenta lo que
// Marcelo ve en el CRM: gente que escribió por WhatsApp, bajó el presupuesto de
// la calculadora o dejó su teléfono en el chat de la web.
//
//   GET /api/stats/consultas?desde=2026-11-01&hasta=2026-11-19
//   Authorization: Bearer <STATS_TOKEN>
//
// Fechas en hora de Buenos Aires, ambos extremos incluidos.

// Las pruebas del equipo no son consultas. Además de los teléfonos cargados en
// Equipo (tabla personal): el celular de Marcelo, el WhatsApp del negocio y el
// de Matías (personal y el de Nubera).
const TELEFONOS_DEL_EQUIPO = ['3425696876', '3425196295', '3624632563', '3625183286']

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

function autorizado(request: Request): boolean {
  const esperado = process.env.STATS_TOKEN
  const recibido = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!esperado || !recibido) {
    return false
  }
  // Se comparan los hashes para que el largo distinto no corte antes de tiempo.
  const hash = (valor: string) => createHash('sha256').update(valor).digest()
  return timingSafeEqual(hash(recibido), hash(esperado))
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'No disponible.' }, { status: 503 })
  }

  const params = new URL(request.url).searchParams
  const desde = params.get('desde') ?? ''
  const hasta = params.get('hasta') ?? ''
  if (!FECHA_RE.test(desde) || !FECHA_RE.test(hasta) || desde > hasta) {
    return NextResponse.json({ error: 'Fechas inválidas.' }, { status: 400 })
  }

  const filas = await db()`
    with equipo as (
      select right(regexp_replace(telefono, '\D', '', 'g'), 10) as tel
      from personal where telefono is not null
      union select unnest(${TELEFONOS_DEL_EQUIPO}::text[])
    )
    select
      to_char(started_at at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD') as fecha,
      source as canal,
      count(*)::int as consultas
    from conversations c
    where site_id = ${SITE_ID}
      and not is_demo
      and (started_at at time zone 'America/Argentina/Buenos_Aires')::date
          between ${desde}::date and ${hasta}::date
      and (
        (source = 'whatsapp' and last_inbound_at is not null)
        or source = 'calculadora'
        or (source = 'chat' and phone is not null)
      )
      and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) not in (select tel from equipo)
    group by 1, 2
    order by 1, 2
  `

  return NextResponse.json({ filas }, { headers: { 'Cache-Control': 'no-store' } })
}
