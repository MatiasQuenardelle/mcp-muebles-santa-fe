// Lo que rodea al libro de caja: cuentas, categorías, gastos fijos y notas de la
// empresa. La plata en sí entra únicamente por registrarMovimiento.

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { formatDateTime } from '@/lib/adminFormat'
import { db } from '@/lib/db'
import { periodoDeGastoFijo, type ClaveCategoria, type FrecuenciaGasto, type GrupoCategoria } from './calculos'
import { InputError, parseEnum, parseFecha, parseMonto, parseMontoOCero, parseTexto, parseUuid } from './entrada'
import { registrarMovimiento } from './movimientos'
import type { TipoCuenta } from './tipos'

const TIPOS_CUENTA: readonly TipoCuenta[] = ['efectivo', 'banco', 'billetera']
const GRUPOS: readonly GrupoCategoria[] = ['ingreso', 'negocio', 'familia']
const FRECUENCIAS: readonly FrecuenciaGasto[] = ['semanal', 'mensual']
const MAX_GASTOS_POR_CARGA = 100

export const PERIODOS_CHIP = [
  { clave: 'semana_actual', label: 'Semana' },
  { clave: 'mes_actual', label: 'Mes' },
  { clave: 'mes_anterior', label: 'Mes anterior' },
  { clave: 'anio_actual', label: 'Año' },
] as const

export type PeriodoChip = (typeof PERIODOS_CHIP)[number]['clave']
export const PERIODO_INICIAL: PeriodoChip = 'mes_actual'

export function leerPeriodo(valor: unknown): PeriodoChip {
  return PERIODOS_CHIP.find((opcion) => opcion.clave === valor)?.clave ?? PERIODO_INICIAL
}

export function responderError(error: unknown, contexto: string): NextResponse {
  if (error instanceof InputError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  console.error(contexto, error)
  return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
}

function objeto(cuerpo: unknown): Record<string, unknown> {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    throw new InputError('Pedido inválido.')
  }
  return cuerpo as Record<string, unknown>
}

function parseBooleano(valor: unknown, campo: string): boolean {
  if (typeof valor !== 'boolean') {
    throw new InputError(`${campo}: valor inválido.`)
  }
  return valor
}

// En un PATCH lo que no viene no se toca; null deja la columna como está (coalesce).
function opcional<T>(valor: unknown, parsear: (crudo: unknown) => T): T | null {
  return valor === undefined ? null : parsear(valor)
}

async function sinDuplicar<T>(mensaje: string, consulta: () => PromiseLike<T>): Promise<T> {
  try {
    return await consulta()
  } catch (causa) {
    if ((causa as { code?: string } | null)?.code === '23505') {
      throw new InputError(mensaje)
    }
    throw causa
  }
}

// ---------------------------------------------------------------- Cuentas

export interface CuentaFila {
  id: string
  nombre: string
  tipo: TipoCuenta
  saldo_inicial: number
  activa: boolean
}

const CUENTA_DUPLICADA = 'Ya hay una cuenta con ese nombre.'

// Incluye las dadas de baja: REPORTES.cuentas las omite si no tienen plata, y acá
// hacen falta para poder reactivarlas o filtrar sus movimientos viejos.
export async function listarCuentas(): Promise<CuentaFila[]> {
  const sql = db()
  const filas = await sql`
    select id, nombre, tipo, saldo_inicial::float8 as saldo_inicial, activa
    from cuentas
    order by activa desc, created_at, nombre
  `
  return filas as unknown as CuentaFila[]
}

export async function crearCuenta(cuerpo: unknown): Promise<void> {
  const dato = objeto(cuerpo)
  const nombre = parseTexto(dato.nombre, 'el nombre', 80)
  const tipo = parseEnum(dato.tipo, TIPOS_CUENTA, 'Tipo de cuenta')
  const saldoInicial = parseMontoOCero(dato.saldoInicial, 'Saldo inicial')
  const sql = db()
  await sinDuplicar(
    CUENTA_DUPLICADA,
    () => sql`insert into cuentas (nombre, tipo, saldo_inicial) values (${nombre}, ${tipo}, ${saldoInicial})`
  )
}

/** False si la cuenta no existe. */
export async function actualizarCuenta(idCrudo: unknown, cuerpo: unknown): Promise<boolean> {
  const id = parseUuid(idCrudo, 'Cuenta')
  const dato = objeto(cuerpo)
  const nombre = opcional(dato.nombre, (crudo) => parseTexto(crudo, 'el nombre', 80))
  const tipo = opcional(dato.tipo, (crudo) => parseEnum(crudo, TIPOS_CUENTA, 'Tipo de cuenta'))
  const saldoInicial = opcional(dato.saldoInicial, (crudo) => parseMontoOCero(crudo, 'Saldo inicial'))
  const activa = opcional(dato.activa, (crudo) => parseBooleano(crudo, 'Activa'))
  const sql = db()
  const filas = await sinDuplicar(
    CUENTA_DUPLICADA,
    () => sql`
      update cuentas set
        nombre = coalesce(${nombre}, nombre),
        tipo = coalesce(${tipo}, tipo),
        saldo_inicial = coalesce(${saldoInicial}::numeric, saldo_inicial),
        activa = coalesce(${activa}::boolean, activa)
      where id = ${id}::uuid
      returning id
    `
  )
  return filas.length > 0
}

// ---------------------------------------------------------------- Categorías

export interface CategoriaFila {
  id: string
  nombre: string
  grupo: GrupoCategoria
  clave: ClaveCategoria | null
  activa: boolean
}

const CATEGORIA_DUPLICADA = 'Ya hay una categoría con ese nombre en ese grupo.'

export async function listarCategorias(): Promise<CategoriaFila[]> {
  const sql = db()
  const filas = await sql`
    select id, nombre, grupo, clave, activa
    from categorias
    order by grupo, activa desc, nombre
  `
  return filas as unknown as CategoriaFila[]
}

// Nunca con `clave`: las claves las pone el esquema y cada una tiene reglas propias.
export async function crearCategoria(cuerpo: unknown): Promise<void> {
  const dato = objeto(cuerpo)
  const nombre = parseTexto(dato.nombre, 'el nombre', 80)
  const grupo = parseEnum(dato.grupo, GRUPOS, 'Grupo')
  const sql = db()
  await sinDuplicar(
    CATEGORIA_DUPLICADA,
    () => sql`insert into categorias (nombre, grupo) values (${nombre}, ${grupo})`
  )
}

/** False si la categoría no existe. */
export async function actualizarCategoria(idCrudo: unknown, cuerpo: unknown): Promise<boolean> {
  const id = parseUuid(idCrudo, 'Categoría')
  const dato = objeto(cuerpo)
  // Se rechaza en vez de ignorarlo: cambiar el grupo reescribiría la ganancia de los
  // meses pasados, y quien lo pida tiene que enterarse de que no pasó.
  if (dato.grupo !== undefined || dato.clave !== undefined) {
    throw new InputError('El grupo y la clave de una categoría no se pueden cambiar.')
  }
  const nombre = opcional(dato.nombre, (crudo) => parseTexto(crudo, 'el nombre', 80))
  const activa = opcional(dato.activa, (crudo) => parseBooleano(crudo, 'Activa'))

  const sql = db()
  const filas = await sql`select clave from categorias where id = ${id}::uuid`
  if (filas.length === 0) {
    return false
  }
  if (filas[0].clave !== null) {
    throw new InputError('Esta categoría tiene reglas propias: no se puede renombrar ni dar de baja.')
  }
  if (activa === false) {
    // Si no, el gasto fijo fallaría recién el día que se lo quiera cargar.
    const usos = await sql`
      select nombre from gastos_fijos where categoria_id = ${id}::uuid and activo order by nombre
    `
    if (usos.length > 0) {
      const nombres = usos.map((uso) => uso.nombre).join(', ')
      throw new InputError(`La usa el gasto fijo ${nombres}. Cambiale la categoría o dalo de baja primero.`)
    }
  }

  await sinDuplicar(
    CATEGORIA_DUPLICADA,
    () => sql`
      update categorias set
        nombre = coalesce(${nombre}, nombre),
        activa = coalesce(${activa}::boolean, activa)
      where id = ${id}::uuid and clave is null
    `
  )
  return true
}

// ---------------------------------------------------------------- Gastos fijos

export interface GastoFijoFila {
  id: string
  nombre: string
  categoria_id: string
  categoria_nombre: string
  grupo: GrupoCategoria
  monto: number
  frecuencia: FrecuenciaGasto
  activo: boolean
}

export interface ResultadoCargaFijo {
  gastoFijoId: string
  estado: 'creado' | 'ya_cargado' | 'error'
  mensaje?: string
}

export async function listarGastosFijos(): Promise<GastoFijoFila[]> {
  const sql = db()
  const filas = await sql`
    select
      g.id, g.nombre, g.categoria_id, c.nombre as categoria_nombre, c.grupo,
      g.monto::float8 as monto, g.frecuencia, g.activo
    from gastos_fijos g
    join categorias c on c.id = g.categoria_id
    order by g.activo desc, c.grupo = 'familia', g.nombre
  `
  return filas as unknown as GastoFijoFila[]
}

/** Lo ya cargado, como `gastoId:periodo`. De los vigentes: un anulado se puede volver a cargar. */
export async function periodosCargados(): Promise<string[]> {
  const sql = db()
  const filas = await sql`
    select gasto_fijo_id, periodo
    from movimientos_vigentes
    where gasto_fijo_id is not null and periodo is not null
  `
  return filas.map((fila) => `${fila.gasto_fijo_id}:${fila.periodo}`)
}

// Las categorías con clave piden proveedor u obra y las de ingreso no son un gasto:
// un gasto fijo en cualquiera de ellas no se podría generar nunca.
async function exigirCategoriaDeGasto(categoriaId: string): Promise<void> {
  const sql = db()
  const filas = await sql`select grupo, clave, activa from categorias where id = ${categoriaId}::uuid`
  if (filas.length === 0 || !filas[0].activa) {
    throw new InputError('Esa categoría no existe o está dada de baja.')
  }
  if (filas[0].clave !== null || filas[0].grupo === 'ingreso') {
    throw new InputError('Un gasto fijo va en una categoría común de gastos del negocio o de la familia.')
  }
}

export async function crearGastoFijo(cuerpo: unknown): Promise<void> {
  const dato = objeto(cuerpo)
  const nombre = parseTexto(dato.nombre, 'el nombre', 120)
  const categoriaId = parseUuid(dato.categoriaId, 'Categoría')
  const monto = parseMonto(dato.monto)
  const frecuencia = parseEnum(dato.frecuencia, FRECUENCIAS, 'Frecuencia')
  await exigirCategoriaDeGasto(categoriaId)
  const sql = db()
  await sql`
    insert into gastos_fijos (nombre, categoria_id, monto, frecuencia)
    values (${nombre}, ${categoriaId}::uuid, ${monto}, ${frecuencia})
  `
}

/** False si el gasto fijo no existe. */
export async function actualizarGastoFijo(idCrudo: unknown, cuerpo: unknown): Promise<boolean> {
  const id = parseUuid(idCrudo, 'Gasto fijo')
  const dato = objeto(cuerpo)
  const nombre = opcional(dato.nombre, (crudo) => parseTexto(crudo, 'el nombre', 120))
  const categoriaId = opcional(dato.categoriaId, (crudo) => parseUuid(crudo, 'Categoría'))
  const monto = opcional(dato.monto, (crudo) => parseMonto(crudo))
  const frecuencia = opcional(dato.frecuencia, (crudo) => parseEnum(crudo, FRECUENCIAS, 'Frecuencia'))
  const activo = opcional(dato.activo, (crudo) => parseBooleano(crudo, 'Activo'))

  const sql = db()
  const actuales = await sql`select categoria_id, activo from gastos_fijos where id = ${id}::uuid`
  if (actuales.length === 0) {
    return false
  }
  if (categoriaId !== null || (activo ?? actuales[0].activo)) {
    await exigirCategoriaDeGasto(categoriaId ?? actuales[0].categoria_id)
  }

  await sql`
    update gastos_fijos set
      nombre = coalesce(${nombre}, nombre),
      categoria_id = coalesce(${categoriaId}::uuid, categoria_id),
      monto = coalesce(${monto}::numeric, monto),
      frecuencia = coalesce(${frecuencia}, frecuencia),
      activo = coalesce(${activo}::boolean, activo)
    where id = ${id}::uuid
  `
  return true
}

/** False si no existía. Lo ya cargado queda en la caja: el vínculo pasa a null. */
export async function borrarGastoFijo(idCrudo: unknown): Promise<boolean> {
  const id = parseUuid(idCrudo, 'Gasto fijo')
  const sql = db()
  const filas = await sql`delete from gastos_fijos where id = ${id}::uuid returning id`
  return filas.length > 0
}

// El período se deriva acá, de la fecha y de la frecuencia guardada: es lo que evita
// cargar dos veces el mismo gasto, así que nada de eso puede venir del navegador.
// Cada gasto se registra por separado y puede fallar solo, de ahí el resultado por ítem.
export async function cargarGastosFijos(cuerpo: unknown, actorId: string): Promise<ResultadoCargaFijo[]> {
  const dato = objeto(cuerpo)
  const fecha = parseFecha(dato.fecha)
  const cuentaId = parseUuid(dato.cuentaId, 'Cuenta')
  if (!Array.isArray(dato.items) || dato.items.length === 0 || dato.items.length > MAX_GASTOS_POR_CARGA) {
    throw new InputError('Elegí qué gastos cargar.')
  }
  const items = dato.items.map((crudo) => {
    const item = objeto(crudo)
    return { gastoFijoId: parseUuid(item.gastoFijoId, 'Gasto fijo'), monto: parseMonto(item.monto) }
  })

  const sql = db()
  const cuentas = await sql`select 1 from cuentas where id = ${cuentaId}::uuid and activa`
  if (cuentas.length === 0) {
    throw new InputError('Esa cuenta no existe o está dada de baja.')
  }

  const ids = items.map((item) => item.gastoFijoId)
  const filas = (await sql`
    select id, nombre, categoria_id, frecuencia
    from gastos_fijos
    where id = any(${ids}::uuid[]) and activo
  `) as unknown as { id: string; nombre: string; categoria_id: string; frecuencia: FrecuenciaGasto }[]
  const fijos = new Map(filas.map((fila) => [fila.id, fila]))

  const resultados: ResultadoCargaFijo[] = []
  for (const { gastoFijoId, monto } of items) {
    const fijo = fijos.get(gastoFijoId)
    if (!fijo) {
      resultados.push({ gastoFijoId, estado: 'error', mensaje: 'Ya no está activo.' })
      continue
    }
    try {
      const { creado } = await registrarMovimiento(
        {
          id: randomUUID(),
          fecha,
          tipo: 'egreso',
          monto,
          cuentaId,
          cuentaDestinoId: null,
          categoriaId: fijo.categoria_id,
          obraId: null,
          proveedorId: null,
          personalId: null,
          nota: fijo.nombre,
        },
        actorId,
        { gastoFijoId, periodo: periodoDeGastoFijo(fijo.frecuencia, fecha) }
      )
      resultados.push({ gastoFijoId, estado: creado ? 'creado' : 'ya_cargado' })
    } catch (causa) {
      if (causa instanceof InputError) {
        resultados.push({ gastoFijoId, estado: 'error', mensaje: causa.message })
      } else {
        console.error('No se pudo cargar el gasto fijo', gastoFijoId, causa)
        resultados.push({ gastoFijoId, estado: 'error', mensaje: 'No se pudo guardar. Probá de nuevo.' })
      }
    }
  }
  return resultados
}

// ---------------------------------------------------------------- Notas de la empresa

export interface NotaFila {
  id: string
  titulo: string
  contenido: string
  actualizada: string
  actualizado_por_nombre: string | null
}

function parseNota(cuerpo: unknown): { titulo: string; contenido: string } {
  const dato = objeto(cuerpo)
  return {
    titulo: parseTexto(dato.titulo, 'el título', 120),
    contenido: parseTexto(dato.contenido, 'el contenido', 5000),
  }
}

export async function listarNotas(): Promise<NotaFila[]> {
  const sql = db()
  const filas = (await sql`
    select n.id, n.titulo, n.contenido, n.updated_at, u.name as actualizado_por_nombre
    from empresa_notas n
    left join admin_users u on u.id = n.actualizado_por
    order by lower(n.titulo)
  `) as unknown as (Omit<NotaFila, 'actualizada'> & { updated_at: string | Date })[]
  return filas.map(({ updated_at, ...nota }) => ({
    ...nota,
    actualizada: formatDateTime(new Date(updated_at).toISOString()),
  }))
}

export async function crearNota(cuerpo: unknown, actorId: string): Promise<void> {
  const { titulo, contenido } = parseNota(cuerpo)
  const sql = db()
  await sql`
    insert into empresa_notas (titulo, contenido, actualizado_por)
    values (${titulo}, ${contenido}, ${actorId}::uuid)
  `
}

/** False si la nota no existe. */
export async function actualizarNota(idCrudo: unknown, cuerpo: unknown, actorId: string): Promise<boolean> {
  const id = parseUuid(idCrudo, 'Nota')
  const { titulo, contenido } = parseNota(cuerpo)
  const sql = db()
  const filas = await sql`
    update empresa_notas
    set titulo = ${titulo}, contenido = ${contenido}, updated_at = now(), actualizado_por = ${actorId}::uuid
    where id = ${id}::uuid
    returning id
  `
  return filas.length > 0
}

/** False si la nota no existe. */
export async function borrarNota(idCrudo: unknown): Promise<boolean> {
  const id = parseUuid(idCrudo, 'Nota')
  const sql = db()
  const filas = await sql`delete from empresa_notas where id = ${id}::uuid returning id`
  return filas.length > 0
}
