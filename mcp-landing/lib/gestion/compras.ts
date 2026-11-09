// Compras y proveedores: qué se lee y qué se escribe de estas tablas. El total de
// una compra no se guarda: siempre es la suma de sus renglones, redondeados uno por
// uno igual que en proveedoresConCuenta. Cuánto se debe y qué está pagado sale de
// ahí, no de acá.

import { db } from '@/lib/db'
import {
  InputError,
  parseCantidad,
  parseEnum,
  parseFecha,
  parseFechaOpcional,
  parseMontoOCero,
  parseTexto,
  parseTextoOpcional,
  parseUuid,
  parseUuidOpcional,
} from './entrada'
import type { EstadoCompra } from './tipos'

export const LIMITE_COMPRAS = 300
// `send` usa keepalive y el navegador corta ese cuerpo en 64 KB.
const MAX_RENGLONES = 100
const ESTADOS_INICIALES = ['pedido', 'recibido'] as const

export interface CompraFila {
  id: string
  proveedor_id: string
  proveedor_nombre: string
  fecha: string
  comprobante: string | null
  estado: EstadoCompra
  recibida_en: string | null
  vence_el: string | null
  total: number
  renglones: number
}

export interface RenglonFila {
  id: string
  descripcion: string
  cantidad: number
  precio: number
  subtotal: number
  obra_id: string | null
  obra_numero: string | null
  obra_titulo: string | null
  obra_cliente: string | null
}

export interface CompraDetalle extends CompraFila {
  items: RenglonFila[]
}

export interface UltimoPrecio {
  descripcion: string
  precio: number
  fecha: string
  proveedor_nombre: string
}

export interface RenglonEntrada {
  descripcion: string
  cantidad: number
  precio: number
  obraId: string | null
}

export interface CompraDatos {
  proveedorId: string
  fecha: string
  comprobante: string | null
  venceEl: string | null
  renglones: RenglonEntrada[]
}

export interface CompraNueva extends CompraDatos {
  id: string
  estado: (typeof ESTADOS_INICIALES)[number]
}

export interface Recepcion {
  recibidaEn: string
  comprobante: string | null
  venceEl: string | null
}

export interface ProveedorDatos {
  nombre: string
  telefono: string | null
  cuit: string | null
  rubro: string | null
  saldoInicial: number
  activo: boolean
}

// ---------------------------------------------------------------- Entrada

function objeto(cuerpo: unknown): Record<string, unknown> {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    throw new InputError('Pedido inválido.')
  }
  return cuerpo as Record<string, unknown>
}

export function uuidValido(valor: string): boolean {
  try {
    parseUuid(valor)
    return true
  } catch {
    return false
  }
}

function parseRenglones(valor: unknown): RenglonEntrada[] {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw new InputError('Cargá al menos un renglón.')
  }
  if (valor.length > MAX_RENGLONES) {
    throw new InputError(`Una compra admite hasta ${MAX_RENGLONES} renglones.`)
  }
  return valor.map((crudo, indice) => {
    const renglon = `renglón ${indice + 1}`
    const dato = objeto(crudo)
    return {
      descripcion: parseTexto(dato.descripcion, `descripción del ${renglon}`),
      cantidad: parseCantidad(dato.cantidad, `Cantidad del ${renglon}`),
      precio: parseMontoOCero(dato.precio, `Precio del ${renglon}`),
      obraId: parseUuidOpcional(dato.obraId, `Obra del ${renglon}`),
    }
  })
}

export function parseCompraDatos(cuerpo: unknown): CompraDatos {
  const dato = objeto(cuerpo)
  const fecha = parseFecha(dato.fecha)
  const venceEl = parseFechaOpcional(dato.venceEl, 'Vencimiento')
  // Si no, la compra nace vencida y nadie sabe por qué.
  if (venceEl !== null && venceEl < fecha) {
    throw new InputError('El vencimiento no puede ser anterior a la fecha de la compra.')
  }
  return {
    proveedorId: parseUuid(dato.proveedorId, 'Proveedor'),
    fecha,
    comprobante: parseTextoOpcional(dato.comprobante, 100),
    venceEl,
    renglones: parseRenglones(dato.renglones),
  }
}

export function parseCompraNueva(cuerpo: unknown): CompraNueva {
  const dato = objeto(cuerpo)
  return {
    ...parseCompraDatos(dato),
    id: parseUuid(dato.id, 'Identificador de la compra'),
    estado: parseEnum(dato.estado, ESTADOS_INICIALES, 'Estado'),
  }
}

export function parseRecepcion(cuerpo: unknown): Recepcion {
  const dato = objeto(cuerpo)
  return {
    recibidaEn: parseFecha(dato.recibidaEn, 'Fecha de recepción'),
    comprobante: parseTextoOpcional(dato.comprobante, 100),
    venceEl: parseFechaOpcional(dato.venceEl, 'Vencimiento'),
  }
}

export function parseProveedorDatos(cuerpo: unknown): ProveedorDatos {
  const dato = objeto(cuerpo)
  if (typeof dato.activo !== 'boolean') {
    throw new InputError('Pedido inválido.')
  }
  return {
    nombre: parseTexto(dato.nombre, 'el nombre del proveedor', 120),
    telefono: parseTextoOpcional(dato.telefono, 40),
    cuit: parseTextoOpcional(dato.cuit, 20),
    rubro: parseTextoOpcional(dato.rubro, 80),
    saldoInicial: parseMontoOCero(dato.saldoInicial, 'Lo que ya le debías'),
    activo: dato.activo,
  }
}

// ---------------------------------------------------------------- Lecturas

export async function listarCompras(
  filtro: { id?: string; estado?: EstadoCompra; proveedorId?: string } = {}
): Promise<CompraFila[]> {
  const sql = db()
  const { id = null, estado = null, proveedorId = null } = filtro
  const filas = await sql`
    select
      c.id, c.proveedor_id, p.nombre as proveedor_nombre, c.comprobante, c.estado,
      c.fecha::text as fecha,
      c.recibida_en::text as recibida_en,
      c.vence_el::text as vence_el,
      coalesce(t.total, 0)::float8 as total,
      coalesce(t.renglones, 0)::int as renglones
    from compras c
    join proveedores p on p.id = c.proveedor_id
    left join lateral (
      select sum(round(i.cantidad * i.precio, 2)) as total, count(*) as renglones
      from compra_items i
      where i.compra_id = c.id
    ) t on true
    where (${id}::uuid is null or c.id = ${id}::uuid)
      and (${estado}::text is null or c.estado = ${estado}::text)
      and (${proveedorId}::uuid is null or c.proveedor_id = ${proveedorId}::uuid)
    order by c.fecha desc, c.created_at desc
    limit ${LIMITE_COMPRAS}
  `
  return filas as unknown as CompraFila[]
}

export async function obtenerCompra(id: string): Promise<CompraDetalle | null> {
  const sql = db()
  const [compras, items] = await Promise.all([
    listarCompras({ id }),
    sql`
      select
        i.id, i.descripcion, i.obra_id,
        i.cantidad::float8 as cantidad,
        i.precio::float8 as precio,
        round(i.cantidad * i.precio, 2)::float8 as subtotal,
        o.numero as obra_numero, o.titulo as obra_titulo, o.cliente as obra_cliente
      from compra_items i
      left join obras o on o.id = i.obra_id
      where i.compra_id = ${id}::uuid
      order by i.id
    `,
  ])
  return compras[0] ? { ...compras[0], items: items as unknown as RenglonFila[] } : null
}

/**
 * El último precio de cada descripción, para sugerirlo al cargar. Una compra
 * cancelada no cuenta, y la que se está editando tampoco: su propio precio no es
 * un antecedente.
 */
export async function ultimosPrecios(excluirCompraId: string | null = null): Promise<UltimoPrecio[]> {
  const sql = db()
  const filas = await sql`
    select descripcion, precio, fecha, proveedor_nombre
    from (
      select distinct on (lower(i.descripcion))
        i.descripcion,
        i.precio::float8 as precio,
        c.fecha::text as fecha,
        p.nombre as proveedor_nombre
      from compra_items i
      join compras c on c.id = i.compra_id
      join proveedores p on p.id = c.proveedor_id
      where c.estado <> 'cancelado'
        and (${excluirCompraId}::uuid is null or c.id <> ${excluirCompraId}::uuid)
      order by lower(i.descripcion), c.fecha desc, c.created_at desc
    ) ultimos
    order by fecha desc
    limit 1000
  `
  return filas as unknown as UltimoPrecio[]
}

// ---------------------------------------------------------------- Escrituras

type Sql = ReturnType<typeof db>

function codigoDeError(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined
}

function relanzar(causa: unknown): never {
  switch (codigoDeError(causa)) {
    case '23503':
      throw new InputError('Alguno de los datos elegidos ya no existe. Recargá la pantalla.')
    case '23514':
      throw new InputError('Los datos de la compra no son consistentes.')
    case '22003':
      throw new InputError('Hay un número demasiado grande.')
    default:
      throw causa
  }
}

// compra_items no tiene columna de orden: la posición va al frente del id, y así
// los renglones se leen siempre como se cargaron.
function idDeRenglon(posicion: number): string {
  return `${posicion.toString(16).padStart(8, '0')}${crypto.randomUUID().slice(8)}`
}

// `estado`: solo se insertan si la compra sigue así. `transaction` es un lote y no
// puede leer y decidir, de modo que la condición tiene que ir en la sentencia.
function insertarRenglones(sql: Sql, compraId: string, estado: EstadoCompra, renglones: RenglonEntrada[]) {
  return sql`
    insert into compra_items (id, compra_id, descripcion, cantidad, precio, obra_id)
    select r.id, ${compraId}::uuid, r.descripcion, r.cantidad, r.precio, r.obra_id
    from unnest(
      ${renglones.map((_, posicion) => idDeRenglon(posicion))}::uuid[],
      ${renglones.map((renglon) => renglon.descripcion)}::text[],
      ${renglones.map((renglon) => renglon.cantidad)}::numeric[],
      ${renglones.map((renglon) => renglon.precio)}::numeric[],
      ${renglones.map((renglon) => renglon.obraId)}::uuid[]
    ) as r(id, descripcion, cantidad, precio, obra_id)
    where exists (select 1 from compras where id = ${compraId}::uuid and estado = ${estado}::text)
  `
}

export async function crearCompra(compra: CompraNueva, actorId: string): Promise<void> {
  const sql = db()
  const recibidaEn = compra.estado === 'recibido' ? compra.fecha : null
  try {
    await sql.transaction([
      sql`
        insert into compras (id, proveedor_id, fecha, comprobante, estado, recibida_en, vence_el, creado_por)
        values (
          ${compra.id}::uuid, ${compra.proveedorId}::uuid, ${compra.fecha}::date, ${compra.comprobante},
          ${compra.estado}, ${recibidaEn}::date, ${compra.venceEl}::date, ${actorId}::uuid
        )
      `,
      insertarRenglones(sql, compra.id, compra.estado, compra.renglones),
    ])
  } catch (causa) {
    // El id lo genera el navegador: si ya existe es el mismo envío repetido, y el
    // error deshizo el lote entero, así que los renglones no se duplicaron.
    if (codigoDeError(causa) !== '23505') {
      relanzar(causa)
    }
  }
}

/** False si la compra no existe o ya no es un pedido: recibida queda fija. */
export async function editarPedido(id: string, datos: CompraDatos): Promise<boolean> {
  const sql = db()
  try {
    // El update va primero porque traba la fila: nadie puede marcarla recibida
    // entre que se borran los renglones viejos y se insertan los nuevos.
    const [actualizada] = (await sql.transaction([
      sql`
        update compras
        set proveedor_id = ${datos.proveedorId}::uuid,
            fecha = ${datos.fecha}::date,
            comprobante = ${datos.comprobante},
            vence_el = ${datos.venceEl}::date,
            updated_at = now()
        where id = ${id}::uuid and estado = 'pedido'
        returning id
      `,
      sql`
        delete from compra_items
        where compra_id = ${id}::uuid
          and exists (select 1 from compras where id = ${id}::uuid and estado = 'pedido')
      `,
      insertarRenglones(sql, id, 'pedido', datos.renglones),
    ])) as [{ id: string }[], unknown, unknown]
    return actualizada.length > 0
  } catch (causa) {
    relanzar(causa)
  }
}

/** False si la compra no existe o ya no es un pedido. */
export async function recibirCompra(id: string, recepcion: Recepcion): Promise<boolean> {
  const sql = db()
  const filas = await sql`
    update compras
    set estado = 'recibido',
        recibida_en = ${recepcion.recibidaEn}::date,
        comprobante = ${recepcion.comprobante},
        vence_el = ${recepcion.venceEl}::date,
        updated_at = now()
    where id = ${id}::uuid and estado = 'pedido'
    returning id
  `
  return filas.length > 0
}

/** False si la compra no existe o ya estaba cancelada. */
export async function cancelarCompra(id: string): Promise<boolean> {
  const sql = db()
  const filas = await sql`
    update compras
    set estado = 'cancelado', updated_at = now()
    where id = ${id}::uuid and estado <> 'cancelado'
    returning id
  `
  return filas.length > 0
}

// El saldo es por proveedor: con el mismo proveedor cargado dos veces, la deuda
// quedaría partida. `id` se excluye para que reintentar un alta no choque consigo.
async function exigirNombreLibre(nombre: string, id: string): Promise<void> {
  const sql = db()
  const filas = await sql`
    select 1 from proveedores
    where lower(nombre) = lower(${nombre}::text) and id <> ${id}::uuid
    limit 1
  `
  if (filas.length > 0) {
    throw new InputError('Ya hay un proveedor con ese nombre. Si no aparece en la lista, reactivalo desde Proveedores.')
  }
}

export async function crearProveedor(id: string, datos: ProveedorDatos): Promise<void> {
  await exigirNombreLibre(datos.nombre, id)
  const sql = db()
  try {
    await sql`
      insert into proveedores (id, nombre, telefono, cuit, rubro, saldo_inicial, activo)
      values (
        ${id}::uuid, ${datos.nombre}, ${datos.telefono}, ${datos.cuit}, ${datos.rubro},
        ${datos.saldoInicial}, ${datos.activo}
      )
      on conflict (id) do nothing
    `
  } catch (causa) {
    relanzar(causa)
  }
}

/** False si el proveedor no existe. */
export async function actualizarProveedor(id: string, datos: ProveedorDatos): Promise<boolean> {
  await exigirNombreLibre(datos.nombre, id)
  const sql = db()
  try {
    const filas = await sql`
      update proveedores
      set nombre = ${datos.nombre},
          telefono = ${datos.telefono},
          cuit = ${datos.cuit},
          rubro = ${datos.rubro},
          saldo_inicial = ${datos.saldoInicial},
          activo = ${datos.activo}
      where id = ${id}::uuid
      returning id
    `
    return filas.length > 0
  } catch (causa) {
    relanzar(causa)
  }
}
