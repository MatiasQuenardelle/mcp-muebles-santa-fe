// Personas, tareas y rendimiento del equipo. Solo servidor: los componentes cliente
// importan de acá únicamente tipos.

import { todayKey } from '@/lib/adminFormat'
import { db, type Viewer } from '@/lib/db'
import type { Periodo } from './calculos'
import {
  InputError,
  parseFechaOpcional,
  parsePorcentaje,
  parseTexto,
  parseTextoOpcional,
  parseUuidOpcional,
} from './entrada'
import type { ReporteVentas } from './tipos'

export interface PersonaFila {
  id: string
  nombre: string
  puesto: string | null
  telefono: string | null
  user_id: string | null
  cuenta_nombre: string | null
  comision_pct: number
  activo: boolean
}

export interface PersonaDatos {
  nombre: string
  puesto: string | null
  telefono: string | null
  userId: string | null
  comisionPct: number
  activo: boolean
}

export interface CuentaPanel {
  id: string
  name: string
}

// Sin montos: esto también le llega a quien no es dueño.
export interface TareaFila {
  id: string
  titulo: string
  detalle: string | null
  personal_id: string | null
  personal_nombre: string | null
  obra_id: string | null
  obra_numero: string | null
  obra_titulo: string | null
  vence_el: string | null
  hecha_el: string | null
}

export interface TareaDatos {
  titulo: string
  detalle: string | null
  personalId: string | null
  obraId: string | null
  venceEl: string | null
}

export interface OpcionesTarea {
  personal: { id: string; nombre: string; activo: boolean }[]
  obras: { id: string; numero: string; titulo: string }[]
}

export interface FiltroTareas {
  // Id de una persona, o 'sin' para las que no tienen a nadie asignado.
  persona?: string | null
  incluirHechas?: boolean
}

export interface TareasDePersona {
  personal_id: string
  abiertas: number
  vencidas: number
  hechas: number
}

export interface FilaRendimiento {
  // Null en la fila de ventas sin vendedor.
  personalId: string | null
  nombre: string
  puesto: string | null
  ventas: number
  vendido: number
  abiertas: number
  vencidas: number
  hechas: number
}

function objeto(cuerpo: unknown): Record<string, unknown> {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    throw new InputError('Pedido inválido.')
  }
  return cuerpo as Record<string, unknown>
}

function codigoDeError(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined
}

function errorDePersona(causa: unknown): unknown {
  const codigo = codigoDeError(causa)
  if (codigo === '23505') {
    return new InputError('Esa cuenta del panel ya está vinculada a otra persona.')
  }
  if (codigo === '23503') {
    return new InputError('Esa cuenta del panel ya no existe. Recargá la pantalla.')
  }
  return causa
}

function errorDeTarea(causa: unknown): unknown {
  return codigoDeError(causa) === '23503'
    ? new InputError('La persona o la obra elegida ya no existe. Recargá la pantalla.')
    : causa
}

// ---------------------------------------------------------------- Personas

export function parsePersona(cuerpo: unknown): PersonaDatos {
  const dato = objeto(cuerpo)
  return {
    nombre: parseTexto(dato.nombre, 'Nombre', 120),
    puesto: parseTextoOpcional(dato.puesto, 120),
    telefono: parseTextoOpcional(dato.telefono, 40),
    userId: parseUuidOpcional(dato.userId, 'Cuenta del panel'),
    comisionPct: parsePorcentaje(dato.comisionPct, 'Comisión'),
    // El alta no manda el campo: siempre arranca activa.
    activo: dato.activo !== false,
  }
}

export async function listarPersonal(): Promise<PersonaFila[]> {
  const sql = db()
  const filas = await sql`
    select
      p.id, p.nombre, p.puesto, p.telefono, p.user_id,
      u.name as cuenta_nombre,
      p.comision_pct::float8 as comision_pct,
      p.activo
    from personal p
    left join admin_users u on u.id = p.user_id
    order by p.activo desc, p.nombre
  `
  return filas as unknown as PersonaFila[]
}

export async function crearPersona(datos: PersonaDatos): Promise<void> {
  const sql = db()
  try {
    await sql`
      insert into personal (nombre, puesto, telefono, user_id, comision_pct, activo)
      values (
        ${datos.nombre}, ${datos.puesto}, ${datos.telefono}, ${datos.userId}::uuid,
        ${datos.comisionPct}, ${datos.activo}
      )
    `
  } catch (causa) {
    throw errorDePersona(causa)
  }
}

export async function actualizarPersona(id: string, datos: PersonaDatos): Promise<boolean> {
  const sql = db()
  try {
    const filas = await sql`
      update personal set
        nombre = ${datos.nombre},
        puesto = ${datos.puesto},
        telefono = ${datos.telefono},
        user_id = ${datos.userId}::uuid,
        comision_pct = ${datos.comisionPct},
        activo = ${datos.activo}
      where id = ${id}::uuid
      returning id
    `
    return filas.length > 0
  } catch (causa) {
    throw errorDePersona(causa)
  }
}

export async function personaDeCuenta(userId: string): Promise<{ id: string; nombre: string } | null> {
  const sql = db()
  const filas = (await sql`
    select id, nombre from personal where user_id = ${userId}::uuid
  `) as unknown as { id: string; nombre: string }[]
  return filas[0] ?? null
}

// ---------------------------------------------------------------- Tareas

export function parseTarea(cuerpo: unknown): TareaDatos {
  const dato = objeto(cuerpo)
  return {
    titulo: parseTexto(dato.titulo, 'Título', 200),
    detalle: parseTextoOpcional(dato.detalle, 2000),
    personalId: parseUuidOpcional(dato.personalId, 'Persona'),
    obraId: parseUuidOpcional(dato.obraId, 'Obra'),
    venceEl: parseFechaOpcional(dato.venceEl, 'Vencimiento'),
  }
}

// El alcance sale de viewer.id contra personal.user_id, nunca de un id que mande
// el navegador: quien no es dueño y no tiene vínculo no ve ninguna fila.
export async function listarTareas(viewer: Viewer, filtro: FiltroTareas = {}): Promise<TareaFila[]> {
  const sql = db()
  const esDueno = viewer.role === 'owner'
  const sinAsignar = esDueno && filtro.persona === 'sin'
  const persona = esDueno && filtro.persona && !sinAsignar ? filtro.persona : null
  const incluirHechas = filtro.incluirHechas === true

  const filas = await sql`
    select
      t.id, t.titulo, t.detalle, t.personal_id,
      p.nombre as personal_nombre,
      t.obra_id, o.numero as obra_numero, o.titulo as obra_titulo,
      t.vence_el::text as vence_el,
      (t.hecha_en at time zone 'America/Argentina/Buenos_Aires')::date::text as hecha_el
    from tareas t
    left join personal p on p.id = t.personal_id
    left join obras o on o.id = t.obra_id
    where (
        ${esDueno}::boolean
        or t.personal_id = (select v.id from personal v where v.user_id = ${viewer.id}::uuid)
      )
      and (${persona}::uuid is null or t.personal_id = ${persona}::uuid)
      and (not ${sinAsignar}::boolean or t.personal_id is null)
      and (${incluirHechas}::boolean or t.hecha_en is null)
    order by t.hecha_en is not null, t.hecha_en desc nulls last, t.vence_el asc nulls last, t.created_at desc
    limit 500
  `
  return filas as unknown as TareaFila[]
}

export async function opcionesTarea(): Promise<OpcionesTarea> {
  const sql = db()
  const [personal, obras] = await Promise.all([
    sql`select id, nombre, activo from personal order by activo desc, nombre`,
    sql`
      select id, numero, titulo from obras
      where entregada_en is null and cancelada_en is null
      order by created_at desc
      limit 300
    `,
  ])
  return {
    personal: personal as unknown as OpcionesTarea['personal'],
    obras: obras as unknown as OpcionesTarea['obras'],
  }
}

export async function crearTarea(datos: TareaDatos, actorId: string): Promise<void> {
  const sql = db()
  try {
    await sql`
      insert into tareas (titulo, detalle, personal_id, obra_id, vence_el, creado_por)
      values (
        ${datos.titulo}, ${datos.detalle}, ${datos.personalId}::uuid,
        ${datos.obraId}::uuid, ${datos.venceEl}::date, ${actorId}::uuid
      )
    `
  } catch (causa) {
    throw errorDeTarea(causa)
  }
}

export async function actualizarTarea(id: string, datos: TareaDatos): Promise<boolean> {
  const sql = db()
  try {
    const filas = await sql`
      update tareas set
        titulo = ${datos.titulo},
        detalle = ${datos.detalle},
        personal_id = ${datos.personalId}::uuid,
        obra_id = ${datos.obraId}::uuid,
        vence_el = ${datos.venceEl}::date
      where id = ${id}::uuid
      returning id
    `
    return filas.length > 0
  } catch (causa) {
    throw errorDeTarea(causa)
  }
}

export async function borrarTarea(id: string): Promise<boolean> {
  const sql = db()
  const filas = await sql`delete from tareas where id = ${id}::uuid returning id`
  return filas.length > 0
}

// Permiso y escritura en la misma sentencia: no hay lectura previa que pueda quedar
// vieja. Completa el dueño, quien la creó o la persona asignada; desmarcar es del
// dueño y de la persona asignada. Sin permiso devuelve false igual que si no
// existiera, así que no revela qué tareas hay.
export async function marcarTarea(id: string, hecha: boolean, viewer: Viewer): Promise<boolean> {
  const sql = db()
  const esDueno = viewer.role === 'owner'
  const filas = await sql`
    update tareas t
    set hecha_en = case when ${hecha}::boolean then coalesce(t.hecha_en, now()) end
    where t.id = ${id}::uuid
      and (
        ${esDueno}::boolean
        or t.personal_id = (select v.id from personal v where v.user_id = ${viewer.id}::uuid)
        or (${hecha}::boolean and t.creado_por = ${viewer.id}::uuid)
      )
    returning t.id
  `
  return filas.length > 0
}

// ---------------------------------------------------------------- Rendimiento

export async function contarTareasPorPersona(rango: Periodo): Promise<TareasDePersona[]> {
  const sql = db()
  const filas = await sql`
    select
      personal_id,
      count(*) filter (where hecha_en is null)::int as abiertas,
      count(*) filter (where hecha_en is null and vence_el < ${todayKey()}::date)::int as vencidas,
      count(*) filter (
        where hecha_en >= (${rango.desde}::timestamp at time zone 'America/Argentina/Buenos_Aires')
          and hecha_en < (${rango.hastaExcl}::timestamp at time zone 'America/Argentina/Buenos_Aires')
      )::int as hechas
    from tareas
    where personal_id is not null
    group by personal_id
  `
  return filas as unknown as TareasDePersona[]
}

export function armarRendimiento(
  personas: PersonaFila[],
  ventas: ReporteVentas,
  tareas: TareasDePersona[]
): FilaRendimiento[] {
  const ventasDe = new Map(ventas.porVendedor.map((fila) => [fila.personalId, fila]))
  const tareasDe = new Map(tareas.map((fila) => [fila.personal_id, fila]))

  const filas: FilaRendimiento[] = []
  for (const persona of personas) {
    const venta = ventasDe.get(persona.id)
    const tarea = tareasDe.get(persona.id)
    // Alguien que ya no trabaja acá solo aparece si todavía tiene algo para mostrar.
    if (!persona.activo && !venta && !tarea?.abiertas && !tarea?.hechas) {
      continue
    }
    filas.push({
      personalId: persona.id,
      nombre: persona.nombre,
      puesto: persona.puesto,
      ventas: venta?.cantidad ?? 0,
      vendido: venta?.vendido ?? 0,
      abiertas: tarea?.abiertas ?? 0,
      vencidas: tarea?.vencidas ?? 0,
      hechas: tarea?.hechas ?? 0,
    })
  }

  const sinVendedor = ventasDe.get(null)
  if (sinVendedor) {
    filas.push({
      personalId: null,
      nombre: sinVendedor.nombre,
      puesto: null,
      ventas: sinVendedor.cantidad,
      vendido: sinVendedor.vendido,
      abiertas: 0,
      vencidas: 0,
      hechas: 0,
    })
  }

  return filas.sort((a, b) => b.vendido - a.vendido)
}
