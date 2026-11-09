// Alta, lecturas y cambios de las obras. Acá vive el contrato y su avance: la plata
// de una obra se lee de obrasConResumen (reportes.ts) y entra por movimientos.ts.

import { contactView, formatMoney, todayKey } from '@/lib/adminFormat'
import type { ConversationStatus } from '@/lib/crm'
import { SITE_ID, addActivity, db, getConversation, getPresupuesto } from '@/lib/db'
import { calcular, type PresupuestoData } from '@/lib/presupuesto'
import { ETAPAS_OBRA, redondear, type EtapaObra } from './calculos'
import {
  InputError,
  parseEnum,
  parseFecha,
  parseFechaOpcional,
  parseMonto,
  parseMontoConSigno,
  parseMontoOCero,
  parsePorcentaje,
  parseTexto,
  parseTextoOpcional,
  parseUuid,
  parseUuidOpcional,
} from './entrada'
import { obrasConResumen } from './reportes'

export class ObraInexistente extends Error {}

const OBRA_CERRADA = 'Esta obra ya está entregada o cancelada.'

function comoObjeto(cuerpo: unknown): Record<string, unknown> {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    throw new InputError('Pedido inválido.')
  }
  return cuerpo as Record<string, unknown>
}

function traducirError(causa: unknown): unknown {
  const { code, constraint } = (causa ?? {}) as { code?: string; constraint?: string }
  if (code === '23505' && constraint === 'obras_presupuesto_uq') {
    return new InputError('Ese presupuesto ya tiene una obra.')
  }
  if (code === '23503') {
    return new InputError('Alguno de los datos elegidos ya no existe. Recargá la pantalla.')
  }
  if (code === '23514') {
    return new InputError('Los datos de la obra no son consistentes.')
  }
  return causa
}

// La obra ya quedó guardada: si falla la nota del historial, reintentar crearía otra.
async function anotarEnContacto(conversationId: string, texto: string, actorId: string): Promise<void> {
  try {
    await addActivity(conversationId, 'obra', texto, actorId)
  } catch (causa) {
    console.error('No se pudo anotar la obra en el historial del contacto', causa)
  }
}

// ---------------------------------------------------------------- Lecturas para todos

// Lo único que puede ver un empleado. Nada de total, cobros, costos, comisión ni
// teléfono del cliente: por eso la lista de columnas es explícita y sin `o.*`.
const COLUMNAS_EQUIPO = `
  id, numero, titulo, cliente, zona, etapa,
  fecha_venta::text as fecha_venta,
  fecha_entrega::text as fecha_entrega,
  entregada_en::text as entregada_en,
  cancelada_en::text as cancelada_en
`

export interface ObraEquipo {
  id: string
  numero: string
  titulo: string
  cliente: string
  zona: string | null
  etapa: EtapaObra
  fecha_venta: string
  fecha_entrega: string | null
  entregada_en: string | null
  cancelada_en: string | null
}

export type VistaObras = 'en_curso' | 'entregadas' | 'canceladas'

// Constantes: nada de esto sale del pedido.
const FILTRO_VISTA: Record<VistaObras, string> = {
  en_curso: 'entregada_en is null and cancelada_en is null order by fecha_entrega asc nulls last, created_at',
  entregadas: 'entregada_en is not null order by entregada_en desc, created_at desc',
  canceladas: 'cancelada_en is not null order by cancelada_en desc, created_at desc',
}

export async function listarObras(vista: VistaObras): Promise<ObraEquipo[]> {
  const filas = await db().query(`select ${COLUMNAS_EQUIPO} from obras where ${FILTRO_VISTA[vista]} limit 500`)
  return filas as unknown as ObraEquipo[]
}

export async function obraParaEquipo(id: string): Promise<ObraEquipo | null> {
  const filas = (await db().query(`select ${COLUMNAS_EQUIPO} from obras where id = $1::uuid`, [
    id,
  ])) as unknown as ObraEquipo[]
  return filas[0] ?? null
}

export interface ObraDeUnContacto {
  id: string
  numero: string
  titulo: string
  etapa: EtapaObra
  fecha_entrega: string | null
  entregada_en: string | null
  cancelada_en: string | null
  presupuesto_id: string | null
}

export async function obrasDelContacto(conversationId: string): Promise<ObraDeUnContacto[]> {
  const sql = db()
  const filas = await sql`
    select
      id, numero, titulo, etapa, presupuesto_id,
      fecha_entrega::text as fecha_entrega,
      entregada_en::text as entregada_en,
      cancelada_en::text as cancelada_en
    from obras
    where conversation_id = ${conversationId}::uuid
    order by created_at desc
  `
  return filas as unknown as ObraDeUnContacto[]
}

export interface EventoObra {
  id: string
  etapa_anterior: EtapaObra | null
  etapa: EtapaObra
  // La escribe siempre el sistema ("Entregada"): nunca lleva montos.
  nota: string | null
  created_at: string
  autor: string | null
}

export async function eventosDeObra(obraId: string): Promise<EventoObra[]> {
  const sql = db()
  const filas = await sql`
    select e.id, e.etapa_anterior, e.etapa, e.nota, e.created_at, u.name as autor
    from obra_eventos e
    left join admin_users u on u.id = e.user_id
    where e.obra_id = ${obraId}::uuid
    order by e.created_at desc
    limit 100
  `
  return filas as unknown as EventoObra[]
}

// ---------------------------------------------------------------- Lecturas solo dueños

export interface FichaObra {
  telefono: string | null
  zona: string | null
  notas: string | null
  conversation_id: string | null
  presupuesto_id: string | null
  presupuesto_numero: string | null
}

/** Los datos que obrasConResumen no trae. Solo para páginas con requireOwnerPage. */
export async function fichaObra(id: string): Promise<FichaObra | null> {
  const sql = db()
  const filas = (await sql`
    select
      o.telefono, o.zona, o.notas, o.conversation_id, o.presupuesto_id,
      p.numero as presupuesto_numero
    from obras o
    left join presupuestos p on p.id = o.presupuesto_id
    where o.id = ${id}::uuid
  `) as unknown as FichaObra[]
  return filas[0] ?? null
}

export interface AjusteObra {
  id: string
  fecha: string
  monto: number
  motivo: string
  autor: string | null
}

export async function listarAjustes(obraId: string): Promise<AjusteObra[]> {
  const sql = db()
  const filas = await sql`
    select a.id, a.fecha::text as fecha, a.monto::float8 as monto, a.motivo, u.name as autor
    from obra_ajustes a
    left join admin_users u on u.id = a.creado_por
    where a.obra_id = ${obraId}::uuid
    order by a.fecha desc, a.created_at desc
  `
  return filas as unknown as AjusteObra[]
}

export interface Vendedor {
  id: string
  nombre: string
  comision_pct: number
}

/** `incluirId`: el vendedor actual de la obra, aunque ya esté dado de baja. */
export async function listarVendedores(incluirId: string | null = null): Promise<Vendedor[]> {
  const sql = db()
  const filas = await sql`
    select id, nombre, comision_pct::float8 as comision_pct
    from personal
    where activo or id = ${incluirId}::uuid
    order by nombre
  `
  return filas as unknown as Vendedor[]
}

export interface PresupuestoListado {
  id: string
  numero: string
  total: number
  enviado_el: string | null
  cliente: string
  contacto_estado: ConversationStatus
  obra_id: string | null
  obra_numero: string | null
  obra_cancelada: boolean
}

export async function listarPresupuestosFormales(): Promise<PresupuestoListado[]> {
  const sql = db()
  const filas = await sql`
    select
      p.id, p.numero, p.total::float8 as total,
      (p.sent_at at time zone 'America/Argentina/Buenos_Aires')::date::text as enviado_el,
      coalesce(nullif(trim(p.data->>'cliente'), ''), c.name, c.card->>'nombre', c.phone, 'Sin nombre') as cliente,
      c.status as contacto_estado,
      o.id as obra_id,
      o.numero as obra_numero,
      coalesce(o.cancelada_en is not null, false) as obra_cancelada
    from presupuestos p
    join conversations c on c.id = p.conversation_id
    left join obras o on o.presupuesto_id = p.id
    where p.kind = 'formal' and c.site_id = ${SITE_ID} and not c.is_demo
    order by p.created_at desc
    limit 500
  `
  return filas as unknown as PresupuestoListado[]
}

// ---------------------------------------------------------------- Alta

export interface CuotaNueva {
  orden: number
  concepto: string
  monto: number
  etapa_exigible: EtapaObra
}

// Cada etapa de pago se puede reclamar desde su etapa de obra. Va por posición en
// ETAPAS de lib/presupuesto: por eso se asigna antes de descartar las que están en cero.
const ETAPA_EXIGIBLE: EtapaObra[] = ['medicion', 'corte', 'armado', 'colocacion']

export function cuotasDePresupuesto(data: Pick<PresupuestoData, 'secciones'>): CuotaNueva[] {
  return calcular(data)
    .etapas.map((etapa, indice) => ({
      orden: indice + 1,
      concepto: etapa.titulo,
      monto: redondear(etapa.monto),
      etapa_exigible: ETAPA_EXIGIBLE[indice],
    }))
    .filter((cuota) => cuota.monto > 0)
}

export interface ObraNueva {
  conversationId: string | null
  presupuestoId: string | null
  // Null si viene de un presupuesto: ahí el total lo pone el presupuesto.
  total: number | null
  // Solo la carga directa, sin contacto.
  directo: { cliente: string; telefono: string | null; titulo: string; zona: string | null } | null
  etapa: EtapaObra
  cobradoInicial: number
  fechaVenta: string
  fechaEntrega: string | null
  vendedorId: string | null
  comisionPct: number
}

export function parseObraNueva(cuerpo: unknown): ObraNueva {
  const dato = comoObjeto(cuerpo)
  const conversationId = parseUuidOpcional(dato.conversationId, 'Contacto')
  const presupuestoId = conversationId ? parseUuidOpcional(dato.presupuestoId, 'Presupuesto') : null
  const vendedorId = parseUuidOpcional(dato.vendedorId, 'Vendedor')
  return {
    conversationId,
    presupuestoId,
    total: presupuestoId ? null : parseMonto(dato.total, 'Total'),
    directo: conversationId
      ? null
      : {
          cliente: parseTexto(dato.cliente, 'cliente', 120),
          telefono: parseTextoOpcional(dato.telefono, 40),
          titulo: parseTexto(dato.titulo, 'título', 200),
          zona: parseTextoOpcional(dato.zona, 120),
        },
    etapa: conversationId ? 'medicion' : parseEnum(dato.etapa, ETAPAS_OBRA, 'Etapa'),
    cobradoInicial: conversationId ? 0 : parseMontoOCero(dato.cobradoInicial, 'Ya cobrado'),
    fechaVenta: conversationId ? todayKey() : parseFecha(dato.fechaVenta, 'Fecha de venta'),
    fechaEntrega: parseFechaOpcional(dato.fechaEntrega, 'Fecha de entrega'),
    vendedorId,
    // Sin vendedor no hay a quién pagarle: un porcentaje suelto inflaría el costo.
    comisionPct: vendedorId ? parsePorcentaje(dato.comisionPct, 'Comisión') : 0,
  }
}

interface Contrato {
  cliente: string
  telefono: string | null
  titulo: string
  zona: string | null
  total: number
  presupuestoId: string | null
  cuotas: CuotaNueva[]
  nota: string
}

async function contratoDeContacto(nueva: ObraNueva, conversationId: string): Promise<Contrato> {
  const contacto = await getConversation(conversationId)
  if (!contacto) {
    throw new InputError('Ese contacto ya no existe.')
  }
  if (contacto.is_demo) {
    throw new InputError('Es un contacto de ejemplo: no se le puede crear una obra.')
  }

  const sql = db()
  const activas = (await sql`
    select numero from obras
    where conversation_id = ${conversationId}::uuid and cancelada_en is null
    limit 1
  `) as unknown as { numero: string }[]
  if (activas.length > 0) {
    throw new InputError(`Este contacto ya tiene la obra N° ${activas[0].numero}.`)
  }

  const persona = contactView(contacto)
  const presupuesto = nueva.presupuestoId ? await getPresupuesto(nueva.presupuestoId) : null
  if (nueva.presupuestoId && presupuesto?.conversation_id !== conversationId) {
    throw new InputError('Ese presupuesto no es de este contacto.')
  }
  if (presupuesto && presupuesto.total <= 0) {
    throw new InputError('Ese presupuesto está en cero: completalo antes de crear la obra.')
  }

  // El preliminar no tiene secciones y `calcular` tiraría error.
  const formal = presupuesto?.kind === 'formal' ? (presupuesto.data as PresupuestoData) : null

  return {
    cliente: persona.nombre || formal?.cliente || persona.telefono || 'Sin nombre',
    telefono: persona.telefono,
    titulo: formal?.proyecto || persona.proyecto || 'Trabajo a medida',
    zona: persona.zona || formal?.localidad || null,
    total: presupuesto ? presupuesto.total : (nueva.total as number),
    presupuestoId: presupuesto?.id ?? null,
    cuotas: formal ? cuotasDePresupuesto(formal) : [],
    nota: presupuesto ? `Obra creada desde el presupuesto N° ${presupuesto.numero}` : 'Obra creada desde el contacto',
  }
}

function contratoDirecto(nueva: ObraNueva): Contrato {
  const directo = nueva.directo as NonNullable<ObraNueva['directo']>
  return {
    ...directo,
    total: nueva.total as number,
    presupuestoId: null,
    cuotas: [],
    nota: 'Obra cargada a mano',
  }
}

export async function crearObra(nueva: ObraNueva, actorId: string): Promise<{ id: string; numero: string }> {
  const contrato = nueva.conversationId
    ? await contratoDeContacto(nueva, nueva.conversationId)
    : contratoDirecto(nueva)

  const sql = db()
  // Se arma acá y no con lpad en SQL: lpad recorta a tres dígitos desde la obra 1000.
  const secuencia = (await sql`select nextval('obra_numero_seq')::int as n`) as unknown as { n: number }[]
  const numero = `${todayKey().slice(0, 4)}-${String(secuencia[0].n).padStart(3, '0')}`
  const id = crypto.randomUUID()

  try {
    await sql.transaction([
      sql`
        insert into obras (
          id, numero, conversation_id, presupuesto_id, cliente, telefono, titulo, zona, etapa,
          total, cobrado_inicial, fecha_venta, fecha_entrega, vendedor_id, comision_pct, creado_por
        ) values (
          ${id}::uuid, ${numero}, ${nueva.conversationId}::uuid, ${contrato.presupuestoId}::uuid,
          ${contrato.cliente}, ${contrato.telefono}, ${contrato.titulo}, ${contrato.zona}, ${nueva.etapa},
          ${contrato.total}, ${nueva.cobradoInicial}, ${nueva.fechaVenta}::date, ${nueva.fechaEntrega}::date,
          ${nueva.vendedorId}::uuid, ${nueva.comisionPct}, ${actorId}::uuid
        )
      `,
      ...contrato.cuotas.map(
        (cuota) => sql`
          insert into obra_cuotas (obra_id, orden, concepto, monto, etapa_exigible)
          values (${id}::uuid, ${cuota.orden}, ${cuota.concepto}, ${cuota.monto}, ${cuota.etapa_exigible})
        `
      ),
      sql`
        insert into obra_eventos (obra_id, etapa_anterior, etapa, nota, user_id)
        values (${id}::uuid, null, ${nueva.etapa}, ${contrato.nota}, ${actorId}::uuid)
      `,
    ])
  } catch (causa) {
    throw traducirError(causa)
  }

  if (nueva.conversationId) {
    // Sin montos: el historial del contacto también lo leen los empleados.
    await anotarEnContacto(nueva.conversationId, `Obra N° ${numero} · ${contrato.titulo}`, actorId)
  }
  return { id, numero }
}

// ---------------------------------------------------------------- Cambios

export async function cambiarEtapa(id: string, etapa: EtapaObra, actorId: string): Promise<void> {
  const sql = db()
  // Una sola sentencia: el evento se escribe solo si la etapa cambió de verdad, y
  // el CTE lee la anterior antes del update para que el historial diga de dónde vino.
  const filas = await sql`
    with previa as (
      select id, etapa from obras
      where id = ${id}::uuid and etapa <> ${etapa}::text
        and entregada_en is null and cancelada_en is null
      for update
    ), cambio as (
      update obras o
      set etapa = ${etapa}::text, updated_at = now()
      from previa
      where o.id = previa.id
      returning o.id, previa.etapa as anterior
    )
    insert into obra_eventos (obra_id, etapa_anterior, etapa, user_id)
    select id, anterior, ${etapa}::text, ${actorId}::uuid from cambio
    returning obra_id
  `
  if (filas.length > 0) {
    return
  }

  const obra = (await sql`
    select entregada_en is not null or cancelada_en is not null as cerrada
    from obras where id = ${id}::uuid
  `) as unknown as { cerrada: boolean }[]
  if (obra.length === 0) {
    throw new ObraInexistente()
  }
  if (obra[0].cerrada) {
    throw new InputError(OBRA_CERRADA)
  }
}

export function parseEtapa(cuerpo: unknown): EtapaObra {
  return parseEnum(comoObjeto(cuerpo).etapa, ETAPAS_OBRA, 'Etapa')
}

export interface AjusteNuevo {
  // Lo genera el navegador, igual que en movimientos: tocar dos veces carga uno.
  id: string
  fecha: string
  monto: number
  motivo: string
}

export function parseAjusteNuevo(cuerpo: unknown): AjusteNuevo {
  const dato = comoObjeto(cuerpo)
  return {
    id: parseUuid(dato.id, 'Identificador del ajuste'),
    fecha: parseFecha(dato.fecha),
    monto: parseMontoConSigno(dato.monto),
    motivo: parseTexto(dato.motivo, 'motivo', 300),
  }
}

// El contrato original no se toca nunca: los cambios son filas con fecha y motivo.
export async function agregarAjuste(obraId: string, ajuste: AjusteNuevo, actorId: string): Promise<void> {
  const obra = (await obrasConResumen()).find((candidata) => candidata.id === obraId)
  if (!obra) {
    throw new ObraInexistente()
  }
  if (obra.resumen.cancelada) {
    throw new InputError('La obra está cancelada: ya no tiene contrato para ajustar.')
  }
  if (redondear(obra.resumen.totalVigente + ajuste.monto) < 0) {
    throw new InputError(
      `Ese descuento deja el contrato por debajo de cero: hoy es de ${formatMoney(obra.resumen.totalVigente)}.`
    )
  }

  const sql = db()
  try {
    await sql`
      insert into obra_ajustes (id, obra_id, fecha, monto, motivo, creado_por)
      values (
        ${ajuste.id}::uuid, ${obraId}::uuid, ${ajuste.fecha}::date,
        ${ajuste.monto}, ${ajuste.motivo}, ${actorId}::uuid
      )
      on conflict (id) do nothing
    `
  } catch (causa) {
    throw traducirError(causa)
  }
}

export interface EdicionObra {
  fechaEntrega: string | null
  notas: string | null
  vendedorId: string | null
  comisionPct: number
}

export function parseEdicionObra(cuerpo: unknown): EdicionObra {
  const dato = comoObjeto(cuerpo)
  const vendedorId = parseUuidOpcional(dato.vendedorId, 'Vendedor')
  return {
    fechaEntrega: parseFechaOpcional(dato.fechaEntrega, 'Fecha de entrega'),
    notas: parseTextoOpcional(dato.notas, 2000),
    vendedorId,
    comisionPct: vendedorId ? parsePorcentaje(dato.comisionPct, 'Comisión') : 0,
  }
}

export async function actualizarObra(id: string, cambios: EdicionObra): Promise<void> {
  const sql = db()
  let filas: Record<string, unknown>[]
  try {
    filas = await sql`
      update obras
      set fecha_entrega = ${cambios.fechaEntrega}::date,
          notas = ${cambios.notas},
          vendedor_id = ${cambios.vendedorId}::uuid,
          comision_pct = ${cambios.comisionPct},
          updated_at = now()
      where id = ${id}::uuid
      returning id
    `
  } catch (causa) {
    throw traducirError(causa)
  }
  if (filas.length === 0) {
    throw new ObraInexistente()
  }
}

// No hay borrado de obras: tienen plata imputada. Entregar y cancelar solo se puede
// desde una obra en curso, y el evento queda atado a que el update haya pasado.
async function cerrarObra(
  id: string,
  columna: 'entregada_en' | 'cancelada_en',
  nota: string,
  actorId: string
): Promise<void> {
  const sql = db()
  const filas = (await sql.query(
    `
    with cierre as (
      update obras
      set ${columna} = $2::date, updated_at = now()
      where id = $1::uuid and entregada_en is null and cancelada_en is null
      returning id, etapa, numero, conversation_id
    ), evento as (
      insert into obra_eventos (obra_id, etapa_anterior, etapa, nota, user_id)
      select id, etapa, etapa, $3::text, $4::uuid from cierre
    )
    select numero, conversation_id from cierre
    `,
    [id, todayKey(), nota, actorId]
  )) as unknown as { numero: string; conversation_id: string | null }[]

  if (filas.length === 0) {
    const existe = await sql`select 1 from obras where id = ${id}::uuid`
    throw existe.length === 0 ? new ObraInexistente() : new InputError(OBRA_CERRADA)
  }
  if (filas[0].conversation_id) {
    await anotarEnContacto(filas[0].conversation_id, `Obra N° ${filas[0].numero}: ${nota.toLowerCase()}`, actorId)
  }
}

export function entregarObra(id: string, actorId: string): Promise<void> {
  return cerrarObra(id, 'entregada_en', 'Entregada', actorId)
}

export function cancelarObra(id: string, actorId: string): Promise<void> {
  return cerrarObra(id, 'cancelada_en', 'Cancelada', actorId)
}
