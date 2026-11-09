// Única puerta de entrada al libro de caja. Cobrar una obra, pagarle a un proveedor
// o liquidar una comisión pasan todos por acá.

import { db } from '@/lib/db'
import { errorDeMovimiento, type ClaveCategoria, type GrupoCategoria } from './calculos'
import { InputError } from './entrada'
import type { MovimientoFila, MovimientoNuevo } from './tipos'

export interface OrigenGastoFijo {
  gastoFijoId: string
  periodo: string
}

function codigoDeError(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined
}

/** `creado` es false si ese id (o ese gasto fijo en ese período) ya estaba cargado. */
export async function registrarMovimiento(
  movimiento: MovimientoNuevo,
  actorId: string,
  origen?: OrigenGastoFijo
): Promise<{ creado: boolean }> {
  const sql = db()

  let categoria: { grupo: GrupoCategoria; clave: ClaveCategoria | null } | null = null
  if (movimiento.categoriaId) {
    const filas = (await sql`
      select grupo, clave from categorias where id = ${movimiento.categoriaId}::uuid and activa
    `) as unknown as { grupo: GrupoCategoria; clave: ClaveCategoria | null }[]
    if (filas.length === 0) {
      throw new InputError('Esa categoría no existe o está dada de baja.')
    }
    categoria = filas[0]
  }

  const error = errorDeMovimiento({
    tipo: movimiento.tipo,
    cuentaId: movimiento.cuentaId,
    cuentaDestinoId: movimiento.cuentaDestinoId,
    categoria,
    obraId: movimiento.obraId,
    proveedorId: movimiento.proveedorId,
    personalId: movimiento.personalId,
  })
  if (error) {
    throw new InputError(error)
  }

  try {
    // Sin columna en el conflict: cubre el id repetido y el gasto fijo ya generado.
    const filas = await sql`
      insert into movimientos (
        id, fecha, tipo, monto, cuenta_id, cuenta_destino_id, categoria_id, grupo,
        obra_id, proveedor_id, personal_id, gasto_fijo_id, periodo, nota, creado_por
      ) values (
        ${movimiento.id}::uuid, ${movimiento.fecha}::date, ${movimiento.tipo}, ${movimiento.monto},
        ${movimiento.cuentaId}::uuid, ${movimiento.cuentaDestinoId}::uuid,
        ${movimiento.categoriaId}::uuid, ${categoria?.grupo ?? null},
        ${movimiento.obraId}::uuid, ${movimiento.proveedorId}::uuid, ${movimiento.personalId}::uuid,
        ${origen?.gastoFijoId ?? null}::uuid, ${origen?.periodo ?? null},
        ${movimiento.nota}, ${actorId}::uuid
      )
      on conflict do nothing
      returning id
    `
    return { creado: filas.length > 0 }
  } catch (causa) {
    const codigo = codigoDeError(causa)
    if (codigo === '23503') {
      throw new InputError('Alguno de los datos elegidos ya no existe. Recargá la pantalla.')
    }
    if (codigo === '23514') {
      throw new InputError('Los datos del movimiento no son consistentes.')
    }
    throw causa
  }
}

/** Corregir un movimiento es anularlo y cargar otro: el original queda a la vista. */
export async function anularMovimiento(id: string, motivo: string, actorId: string): Promise<boolean> {
  const sql = db()
  const filas = await sql`
    update movimientos
    set anulado_en = now(), anulado_por = ${actorId}::uuid, anulado_motivo = ${motivo}
    where id = ${id}::uuid and anulado_en is null
    returning id
  `
  return filas.length > 0
}

export interface FiltroMovimientos {
  obraId?: string
  proveedorId?: string
  personalId?: string
  cuentaId?: string
  grupo?: GrupoCategoria
  desde?: string
  hastaExcl?: string
  incluirAnulados?: boolean
  limite?: number
}

export async function listarMovimientos(filtro: FiltroMovimientos = {}): Promise<MovimientoFila[]> {
  const sql = db()
  const condiciones: string[] = []
  const valores: unknown[] = []
  const agregar = (expresion: (posicion: number) => string, valor: unknown) => {
    valores.push(valor)
    condiciones.push(expresion(valores.length))
  }

  if (filtro.obraId) agregar((n) => `m.obra_id = $${n}::uuid`, filtro.obraId)
  if (filtro.proveedorId) agregar((n) => `m.proveedor_id = $${n}::uuid`, filtro.proveedorId)
  if (filtro.personalId) agregar((n) => `m.personal_id = $${n}::uuid`, filtro.personalId)
  if (filtro.cuentaId) {
    agregar((n) => `(m.cuenta_id = $${n}::uuid or m.cuenta_destino_id = $${n}::uuid)`, filtro.cuentaId)
  }
  if (filtro.grupo) agregar((n) => `m.grupo = $${n}`, filtro.grupo)
  if (filtro.desde) agregar((n) => `m.fecha >= $${n}::date`, filtro.desde)
  if (filtro.hastaExcl) agregar((n) => `m.fecha < $${n}::date`, filtro.hastaExcl)
  if (!filtro.incluirAnulados) condiciones.push('m.anulado_en is null')

  valores.push(Math.min(filtro.limite ?? 200, 1000))
  const donde = condiciones.length > 0 ? `where ${condiciones.join(' and ')}` : ''

  const filas = await sql.query(
    `
    select
      m.id, m.fecha::text as fecha, m.tipo, m.monto::float8 as monto, m.cuenta_id,
      c.nombre as cuenta_nombre, d.nombre as cuenta_destino_nombre,
      cat.nombre as categoria_nombre, cat.clave as categoria_clave, m.grupo,
      m.obra_id, o.numero as obra_numero, o.titulo as obra_titulo,
      m.proveedor_id, p.nombre as proveedor_nombre,
      m.personal_id, pe.nombre as personal_nombre,
      m.nota, u.name as creado_por_nombre, m.created_at,
      m.anulado_en, m.anulado_motivo
    from movimientos m
    join cuentas c on c.id = m.cuenta_id
    left join cuentas d on d.id = m.cuenta_destino_id
    left join categorias cat on cat.id = m.categoria_id
    left join obras o on o.id = m.obra_id
    left join proveedores p on p.id = m.proveedor_id
    left join personal pe on pe.id = m.personal_id
    left join admin_users u on u.id = m.creado_por
    ${donde}
    order by m.fecha desc, m.created_at desc
    limit $${valores.length}
    `,
    valores
  )
  return filas as unknown as MovimientoFila[]
}
