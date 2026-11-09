// Una sola lectura de los números de la empresa: la usan el tablero, las pantallas
// de cada módulo y el asistente, así que siempre dicen lo mismo. Las fórmulas viven
// en calculos.ts; acá solo se trae lo necesario de la base.

import * as React from 'react'
import { formatMoney, todayKey } from '@/lib/adminFormat'
import { db, type Viewer } from '@/lib/db'
import {
  cuentaProveedor,
  cuotasVigentes,
  diasEntre,
  exigibleObra,
  gananciaDeCaja,
  periodoDeGastoFijo,
  rangoPeriodo,
  redondear,
  resumirObra,
  type CompraBase,
  type CuentaProveedor,
  type Cuota,
  type CuotaVigente,
  type EtapaObra,
  type FrecuenciaGasto,
  type ObraBase,
  type Periodo,
  type PeriodoClave,
  type ResumenObra,
  type SumaMovimientos,
} from './calculos'
import type { ObraSaldo, Reportes, TipoCuenta } from './tipos'

export class SinPermiso extends Error {}

export function periodo(clave: PeriodoClave): Periodo {
  return rangoPeriodo(clave, todayKey())
}

// ---------------------------------------------------------------- Lecturas base

export interface ObraFila extends ObraBase {
  id: string
  numero: string
  titulo: string
  cliente: string
  etapa: EtapaObra
  fecha_venta: string
  fecha_entrega: string | null
  vendedor_id: string | null
  vendedor_nombre: string | null
}

export interface ObraConResumen extends ObraFila {
  resumen: ResumenObra
  cuotas: CuotaVigente[]
  exigible: number
}

// El tablero corre varios reportes en el mismo render y todos parten de las obras.
// React.cache solo existe en server components: en un route handler este módulo
// tiene que seguir cargando, y ahí simplemente se consulta de nuevo.
const porRender: typeof React.cache = React.cache ?? ((funcion) => funcion)

export const obrasConResumen = porRender(async (): Promise<ObraConResumen[]> => {
  const sql = db()
  const [filas, cuotasFilas] = await Promise.all([
    sql`
      select
        o.id, o.numero, o.titulo, o.cliente, o.etapa,
        o.total::float8 as total,
        o.cobrado_inicial::float8 as cobrado_inicial,
        o.fecha_venta::text as fecha_venta,
        o.fecha_entrega::text as fecha_entrega,
        o.entregada_en::text as entregada_en,
        o.cancelada_en::text as cancelada_en,
        o.comision_pct::float8 as comision_pct,
        o.vendedor_id,
        p.nombre as vendedor_nombre,
        coalesce(a.total, 0)::float8 as ajustes,
        coalesce(m.cobros, 0)::float8 as cobros,
        coalesce(m.devoluciones, 0)::float8 as devoluciones,
        coalesce(m.gastos, 0)::float8 as gastos_directos,
        coalesce(i.total, 0)::float8 as materiales
      from obras o
      left join personal p on p.id = o.vendedor_id
      left join lateral (
        select sum(monto) as total from obra_ajustes where obra_id = o.id
      ) a on true
      left join lateral (
        select
          sum(v.monto) filter (where c.clave = 'cobro_obra') as cobros,
          sum(v.monto) filter (where c.clave = 'devolucion_cliente') as devoluciones,
          sum(v.monto) filter (
            where v.tipo = 'egreso' and c.clave is distinct from 'devolucion_cliente'
              and c.clave is distinct from 'comision'
          ) as gastos
        from movimientos_vigentes v
        join categorias c on c.id = v.categoria_id
        where v.obra_id = o.id
      ) m on true
      left join lateral (
        select sum(round(ci.cantidad * ci.precio, 2)) as total
        from compra_items ci
        join compras co on co.id = ci.compra_id
        where ci.obra_id = o.id and co.estado = 'recibido'
      ) i on true
      order by o.fecha_venta desc, o.numero desc
    `,
    sql`
      select obra_id, orden, concepto, monto::float8 as monto, etapa_exigible
      from obra_cuotas
      order by obra_id, orden
    `,
  ])

  const cuotasPorObra = new Map<string, Cuota[]>()
  for (const fila of cuotasFilas as unknown as (Cuota & { obra_id: string })[]) {
    const lista = cuotasPorObra.get(fila.obra_id) ?? []
    lista.push({
      orden: fila.orden,
      concepto: fila.concepto,
      monto: fila.monto,
      etapa_exigible: fila.etapa_exigible,
    })
    cuotasPorObra.set(fila.obra_id, lista)
  }

  return (filas as unknown as ObraFila[]).map((obra) => {
    const resumen = resumirObra(obra)
    const cuotas = cuotasVigentes(resumen.totalVigente, resumen.cobradoNeto, cuotasPorObra.get(obra.id) ?? [], {
      etapa: obra.etapa,
      entregada: resumen.entregada,
      cancelada: resumen.cancelada,
    })
    return { ...obra, resumen, cuotas, exigible: exigibleObra(resumen, cuotas) }
  })
})

export interface ProveedorConCuenta {
  id: string
  nombre: string
  telefono: string | null
  cuit: string | null
  rubro: string | null
  activo: boolean
  saldo_inicial: number
  pagos_netos: number
  comprometido: number
  cuenta: CuentaProveedor
}

export const proveedoresConCuenta = porRender(async (): Promise<ProveedorConCuenta[]> => {
  const sql = db()
  const [proveedores, compras] = await Promise.all([
    sql`
      select
        p.id, p.nombre, p.telefono, p.cuit, p.rubro, p.activo,
        p.saldo_inicial::float8 as saldo_inicial,
        coalesce(m.neto, 0)::float8 as pagos_netos
      from proveedores p
      left join lateral (
        select sum(case when c.clave = 'pago_proveedor' then v.monto else -v.monto end) as neto
        from movimientos_vigentes v
        join categorias c on c.id = v.categoria_id
        where v.proveedor_id = p.id and c.clave in ('pago_proveedor', 'devolucion_proveedor')
      ) m on true
      order by p.nombre
    `,
    sql`
      select
        c.id, c.proveedor_id, c.estado,
        c.fecha::text as fecha,
        c.vence_el::text as vence_el,
        sum(round(i.cantidad * i.precio, 2))::float8 as total
      from compras c
      join compra_items i on i.compra_id = c.id
      where c.estado <> 'cancelado'
      group by c.id
    `,
  ])

  const hoy = todayKey()
  const comprasDe = compras as unknown as (CompraBase & { proveedor_id: string; estado: string })[]
  type Fila = Omit<ProveedorConCuenta, 'cuenta' | 'comprometido'>
  return (proveedores as unknown as Fila[]).map((proveedor) => {
    const propias = comprasDe.filter((compra) => compra.proveedor_id === proveedor.id)
    const recibidas = propias.filter((compra) => compra.estado === 'recibido')
    const comprometido = redondear(
      propias.filter((compra) => compra.estado === 'pedido').reduce((suma, compra) => suma + compra.total, 0)
    )
    return {
      ...proveedor,
      comprometido,
      cuenta: cuentaProveedor(proveedor.saldo_inicial, proveedor.pagos_netos, recibidas, hoy),
    }
  })
})

function aObraSaldo(obra: ObraConResumen): ObraSaldo {
  return {
    id: obra.id,
    numero: obra.numero,
    titulo: obra.titulo,
    cliente: obra.cliente,
    totalVigente: obra.resumen.totalVigente,
    cobradoNeto: obra.resumen.cobradoNeto,
    pendiente: obra.resumen.pendiente,
    exigible: obra.exigible,
    saldoAFavor: obra.resumen.saldoAFavor,
  }
}

const sumar = <T>(lista: T[], valor: (item: T) => number) =>
  redondear(lista.reduce((suma, item) => suma + valor(item), 0))

// ---------------------------------------------------------------- Reportes

interface Definicion<K extends keyof Reportes> {
  soloDueno: boolean
  descripcion: string
  usaPeriodo: boolean
  correr(viewer: Viewer, periodo: Periodo): Promise<Reportes[K]>
  // Texto para el asistente. Es lo único que ve el modelo.
  resumir(resultado: Reportes[K], periodo: Periodo): string
}

// El permiso se controla acá y no en cada llamador: el tablero y el asistente no
// pueden olvidárselo.
function definir<K extends keyof Reportes>(reporte: Definicion<K>): Definicion<K> {
  return {
    ...reporte,
    // async: el rechazo tiene que llegar como promesa, no como throw al llamar.
    async correr(viewer, rango) {
      if (reporte.soloDueno && viewer.role !== 'owner') {
        throw new SinPermiso('Este reporte es solo para dueños.')
      }
      return reporte.correr(viewer, rango)
    },
  }
}

const dinero = (valor: number) => formatMoney(valor)
const lista = (items: string[], vacio: string) => (items.length > 0 ? items.join('\n') : vacio)

export const REPORTES: { [K in keyof Reportes]: Definicion<K> } = {
  ventas: definir<'ventas'>({
    soloDueno: true,
    usaPeriodo: true,
    descripcion: 'Cuánto se vendió en un período: contratos firmados más adicionales, total y por vendedor.',
    async correr(_viewer, rango) {
      const sql = db()
      const [obras, ajustes] = await Promise.all([
        obrasConResumen(),
        sql`
          select obra_id, sum(monto)::float8 as total
          from obra_ajustes
          where fecha >= ${rango.desde}::date and fecha < ${rango.hastaExcl}::date
          group by obra_id
        `,
      ])
      const ajustePorObra = new Map(
        (ajustes as unknown as { obra_id: string; total: number }[]).map((fila) => [fila.obra_id, fila.total])
      )

      let cantidad = 0
      let vendido = 0
      const porVendedor = new Map<string, ReturnType<typeof nuevoVendedor>>()
      function nuevoVendedor(personalId: string | null, nombre: string) {
        return { personalId, nombre, cantidad: 0, vendido: 0 }
      }

      for (const obra of obras) {
        if (obra.resumen.cancelada) {
          continue
        }
        const entraEnPeriodo = obra.fecha_venta >= rango.desde && obra.fecha_venta < rango.hastaExcl
        const monto = (entraEnPeriodo ? obra.total : 0) + (ajustePorObra.get(obra.id) ?? 0)
        if (!entraEnPeriodo && monto === 0) {
          continue
        }
        const clave = obra.vendedor_id ?? 'sin'
        const vendedor =
          porVendedor.get(clave) ?? nuevoVendedor(obra.vendedor_id, obra.vendedor_nombre ?? 'Sin vendedor')
        vendedor.vendido = redondear(vendedor.vendido + monto)
        vendedor.cantidad += entraEnPeriodo ? 1 : 0
        porVendedor.set(clave, vendedor)
        vendido = redondear(vendido + monto)
        cantidad += entraEnPeriodo ? 1 : 0
      }

      return {
        cantidad,
        vendido,
        porVendedor: Array.from(porVendedor.values()).sort((a, b) => b.vendido - a.vendido),
      }
    },
    resumir(r, rango) {
      return `Ventas de ${rango.etiqueta}: ${r.cantidad} obras por ${dinero(r.vendido)}.\n${lista(
        r.porVendedor.map((v) => `- ${v.nombre}: ${v.cantidad} obras, ${dinero(v.vendido)}`),
        'Sin ventas cargadas en el período.'
      )}`
    },
  }),

  cobranzas: definir<'cobranzas'>({
    soloDueno: true,
    usaPeriodo: true,
    descripcion:
      'Plata por cobrar a clientes: total pendiente, lo que ya se puede reclamar, anticipos recibidos, saldos a favor y detalle por obra. También lo cobrado en el período.',
    async correr(_viewer, rango) {
      const sql = db()
      const [obras, cobrado] = await Promise.all([
        obrasConResumen(),
        sql`
          select coalesce(sum(case when c.clave = 'cobro_obra' then v.monto else -v.monto end), 0)::float8 as neto
          from movimientos_vigentes v
          join categorias c on c.id = v.categoria_id
          where c.clave in ('cobro_obra', 'devolucion_cliente')
            and v.fecha >= ${rango.desde}::date and v.fecha < ${rango.hastaExcl}::date
        `,
      ])
      const conSaldo = obras
        .filter((obra) => obra.resumen.pendiente > 0 || obra.resumen.saldoAFavor > 0)
        .map(aObraSaldo)
        .sort((a, b) => b.exigible - a.exigible || b.pendiente - a.pendiente)

      return {
        cobradoPeriodo: (cobrado as unknown as { neto: number }[])[0].neto,
        pendiente: sumar(obras, (obra) => obra.resumen.pendiente),
        exigibleAhora: sumar(obras, (obra) => obra.exigible),
        anticipos: sumar(obras, (obra) => obra.resumen.anticipo),
        saldoAFavor: sumar(obras, (obra) => obra.resumen.saldoAFavor),
        obras: conSaldo,
      }
    },
    resumir(r, rango) {
      return [
        `Pendiente de cobrar: ${dinero(r.pendiente)}. Ya se puede reclamar: ${dinero(r.exigibleAhora)}.`,
        `Anticipos recibidos de obras en curso: ${dinero(r.anticipos)}. Saldos a favor de clientes: ${dinero(r.saldoAFavor)}.`,
        `Cobrado neto ${rango.etiqueta}: ${dinero(r.cobradoPeriodo)}.`,
        lista(
          r.obras.slice(0, 20).map(
            (o) => `- ${o.cliente} (${o.titulo}): debe ${dinero(o.pendiente)}, reclamable ${dinero(o.exigible)}`
          ),
          'Ninguna obra tiene saldo pendiente.'
        ),
      ].join('\n')
    },
  }),

  seguimientos: definir<'seguimientos'>({
    soloDueno: false,
    usaPeriodo: false,
    descripcion:
      'Clientes y presupuestos que necesitan seguimiento: fechas de contacto vencidas y presupuestos enviados hace más de 3 días sin respuesta.',
    async correr(viewer) {
      const sql = db()
      const hoy = todayKey()
      const alcance = viewer.role === 'owner' ? null : viewer.id
      const filas = (await sql`
        select
          c.id as "conversationId",
          coalesce(c.name, c.card->>'nombre', c.phone, c.card->>'telefono', 'Sin nombre') as nombre,
          c.follow_up_on::text as fecha,
          c.follow_up_note as nota,
          p.numero as "presupuestoNumero",
          p.total::float8 as "presupuestoTotal",
          p.sent_at::date::text as "presupuestoEnviado"
        from conversations c
        left join lateral (
          select numero, total, sent_at
          from presupuestos
          where conversation_id = c.id and kind = 'formal' and sent_at is not null
          order by sent_at desc
          limit 1
        ) p on true
        where c.site_id = 'mcp'
          and not c.is_demo
          and c.status not in ('ganado', 'perdido')
          and (${alcance}::uuid is null or c.assigned_to = ${alcance}::uuid or c.assigned_to is null)
          and (
            c.follow_up_on <= ${hoy}::date
            or (c.status = 'presupuestado' and c.follow_up_on is null and p.sent_at < now() - interval '3 days')
          )
        order by coalesce(c.follow_up_on, p.sent_at::date) asc
        limit 100
      `) as unknown as Reportes['seguimientos']['items']
      return { vencidos: filas.filter((fila) => fila.fecha !== null && fila.fecha < hoy).length, items: filas }
    },
    resumir(r) {
      return `${r.items.length} contactos necesitan seguimiento (${r.vencidos} con fecha vencida).\n${lista(
        r.items.slice(0, 20).map((item) => {
          const presupuesto = item.presupuestoNumero
            ? ` Presupuesto ${item.presupuestoNumero} por ${dinero(item.presupuestoTotal ?? 0)}, enviado el ${item.presupuestoEnviado}.`
            : ''
          return `- ${item.nombre}${item.fecha ? `: contactar el ${item.fecha}` : ''}.${presupuesto}${item.nota ? ` Nota: ${item.nota}` : ''}`
        }),
        'No hay seguimientos pendientes.'
      )}`
    },
  }),

  atrasadas: definir<'atrasadas'>({
    soloDueno: false,
    usaPeriodo: false,
    descripcion: 'Obras cuya fecha de entrega ya pasó y todavía no se entregaron.',
    async correr() {
      const hoy = todayKey()
      const obras = (await obrasConResumen())
        .filter(
          (obra) =>
            !obra.resumen.entregada &&
            !obra.resumen.cancelada &&
            obra.fecha_entrega !== null &&
            obra.fecha_entrega < hoy
        )
        .map((obra) => ({
          id: obra.id,
          numero: obra.numero,
          titulo: obra.titulo,
          cliente: obra.cliente,
          etapa: obra.etapa,
          fechaEntrega: obra.fecha_entrega as string,
          diasAtraso: diasEntre(obra.fecha_entrega as string, hoy),
        }))
        .sort((a, b) => b.diasAtraso - a.diasAtraso)
      return { cantidad: obras.length, obras }
    },
    resumir(r) {
      return `${r.cantidad} obras atrasadas.\n${lista(
        r.obras.map(
          (o) => `- ${o.cliente} (${o.titulo}): ${o.diasAtraso} días de atraso, entrega ${o.fechaEntrega}, en etapa ${o.etapa}`
        ),
        'No hay obras atrasadas.'
      )}`
    },
  }),

  deudaProveedores: definir<'deudaProveedores'>({
    soloDueno: true,
    usaPeriodo: false,
    descripcion:
      'Cuánto se les debe a los proveedores: deuda total, lo vencido, pedidos sin recibir y saldo por proveedor.',
    async correr() {
      const proveedores = await proveedoresConCuenta()
      return {
        deuda: sumar(proveedores, (p) => p.cuenta.deuda),
        comprometido: sumar(proveedores, (p) => p.comprometido),
        aFavor: sumar(proveedores, (p) => p.cuenta.aFavor),
        vencido: sumar(proveedores, (p) => p.cuenta.vencido),
        proveedores: proveedores
          .filter((p) => p.cuenta.saldo !== 0 || p.comprometido !== 0)
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            saldo: p.cuenta.saldo,
            vencido: p.cuenta.vencido,
            comprometido: p.comprometido,
          }))
          .sort((a, b) => b.saldo - a.saldo),
      }
    },
    resumir(r) {
      return [
        `Deuda con proveedores por mercadería ya recibida: ${dinero(r.deuda)}, de la cual ${dinero(r.vencido)} está vencida.`,
        `Aparte, y sin ser deuda todavía, pedidos sin recibir: ${dinero(r.comprometido)}. Saldo a favor nuestro: ${dinero(r.aFavor)}.`,
        lista(
          r.proveedores.map((p) => `- ${p.nombre}: saldo ${dinero(p.saldo)}, vencido ${dinero(p.vencido)}`),
          'No hay deuda con proveedores.'
        ),
      ].join('\n')
    },
  }),

  ganancia: definir<'ganancia'>({
    soloDueno: true,
    usaPeriodo: true,
    descripcion:
      'Ganancia del período: ganancia de caja del negocio (ingresos menos gastos del negocio), ganancia neta libre (después de los gastos de la familia) y margen por obra.',
    async correr(_viewer, rango) {
      const sql = db()
      const [sumas, sinObra, obras] = await Promise.all([
        sql`
          select grupo, tipo, sum(monto)::float8 as total
          from movimientos_vigentes
          where tipo <> 'transferencia'
            and fecha >= ${rango.desde}::date and fecha < ${rango.hastaExcl}::date
          group by grupo, tipo
        `,
        sql`
          select coalesce(sum(round(i.cantidad * i.precio, 2)), 0)::float8 as total
          from compra_items i
          join compras c on c.id = i.compra_id
          where c.estado = 'recibido' and i.obra_id is null
            and coalesce(c.recibida_en, c.fecha) >= ${rango.desde}::date
            and coalesce(c.recibida_en, c.fecha) < ${rango.hastaExcl}::date
        `,
        obrasConResumen(),
      ])

      // En curso, o cerradas dentro del período: las viejas ya no dicen nada de este mes.
      const cierreDentro = (fecha: string | null) =>
        fecha === null || (fecha >= rango.desde && fecha < rango.hastaExcl)

      return {
        ...gananciaDeCaja(sumas as unknown as SumaMovimientos[]),
        materialesSinObra: (sinObra as unknown as { total: number }[])[0].total,
        porObra: obras
          .filter((obra) => cierreDentro(obra.entregada_en) && cierreDentro(obra.cancelada_en))
          .map((obra) => ({
            id: obra.id,
            numero: obra.numero,
            titulo: obra.titulo,
            contrato: obra.resumen.totalVigente,
            costo: obra.resumen.costo,
            margen: obra.resumen.margen,
            entregada: obra.resumen.entregada,
            cancelada: obra.resumen.cancelada,
          })),
      }
    },
    resumir(r, rango) {
      return [
        `Caja de ${rango.etiqueta}: ingresos ${dinero(r.ingresos)}, gastos del negocio ${dinero(r.gastosNegocio)}.`,
        `Ganancia de caja del negocio: ${dinero(r.gananciaNegocio)}. Gastos de la familia: ${dinero(r.gastosFamilia)}. Ganancia neta libre: ${dinero(r.netaLibre)}.`,
        `Materiales recibidos sin imputar a obra: ${dinero(r.materialesSinObra)}.`,
        'Margen por obra (medida distinta de la caja, no se suman):',
        lista(
          r.porObra.slice(0, 20).map((o) => `- ${o.titulo}: contrato ${dinero(o.contrato)}, costo ${dinero(o.costo)}, margen ${dinero(o.margen)}`),
          'Sin obras en el período.'
        ),
      ].join('\n')
    },
  }),

  gastosPorCategoria: definir<'gastosPorCategoria'>({
    soloDueno: true,
    usaPeriodo: true,
    descripcion: 'En qué se gastó en un período, separado por categoría, del negocio y de la familia.',
    async correr(_viewer, rango) {
      const sql = db()
      const categorias = (await sql`
        select c.id, c.nombre, c.grupo,
          sum(case when v.tipo = 'egreso' then v.monto else -v.monto end)::float8 as total
        from movimientos_vigentes v
        join categorias c on c.id = v.categoria_id
        where c.grupo in ('negocio', 'familia')
          and v.fecha >= ${rango.desde}::date and v.fecha < ${rango.hastaExcl}::date
        group by c.id
        order by total desc
      `) as unknown as Reportes['gastosPorCategoria']['categorias']
      return { total: sumar(categorias, (categoria) => categoria.total), categorias }
    },
    resumir(r, rango) {
      return `Gastos de ${rango.etiqueta}: ${dinero(r.total)}.\n${lista(
        r.categorias.map((c) => `- ${c.nombre} (${c.grupo}): ${dinero(c.total)}`),
        'Sin gastos cargados en el período.'
      )}`
    },
  }),

  cuentas: definir<'cuentas'>({
    soloDueno: true,
    usaPeriodo: false,
    descripcion: 'Saldo actual de cada cuenta: efectivo, banco y billeteras.',
    async correr() {
      const sql = db()
      const filas = (await sql`
        select c.id, c.nombre, c.tipo, c.activa,
          (c.saldo_inicial + coalesce(x.neto, 0))::float8 as saldo
        from cuentas c
        left join lateral (
          select sum(
            case
              when v.cuenta_id = c.id and v.tipo = 'ingreso' then v.monto
              when v.cuenta_id = c.id then -v.monto
              else v.monto
            end
          ) as neto
          from movimientos_vigentes v
          where v.cuenta_id = c.id or v.cuenta_destino_id = c.id
        ) x on true
        order by c.created_at, c.nombre
      `) as unknown as { id: string; nombre: string; tipo: TipoCuenta; activa: boolean; saldo: number }[]
      const visibles = filas.filter((fila) => fila.activa || fila.saldo !== 0)
      return {
        total: sumar(visibles, (fila) => fila.saldo),
        cuentas: visibles.map(({ id, nombre, tipo, saldo }) => ({ id, nombre, tipo, saldo })),
      }
    },
    resumir(r) {
      return `Saldo total en cuentas: ${dinero(r.total)}.\n${lista(
        r.cuentas.map((c) => `- ${c.nombre}: ${dinero(c.saldo)}`),
        'No hay cuentas cargadas.'
      )}`
    },
  }),

  comisiones: definir<'comisiones'>({
    soloDueno: true,
    usaPeriodo: false,
    descripcion: 'Comisiones de vendedores: generadas, pagadas y saldo pendiente por persona.',
    async correr() {
      const sql = db()
      const [obras, personas] = await Promise.all([
        obrasConResumen(),
        sql`
          select p.id, p.nombre, coalesce(x.pagado, 0)::float8 as pagado
          from personal p
          left join lateral (
            select sum(v.monto) as pagado
            from movimientos_vigentes v
            join categorias c on c.id = v.categoria_id
            where v.personal_id = p.id and c.clave = 'comision'
          ) x on true
        `,
      ])
      const porPersona = (personas as unknown as { id: string; nombre: string; pagado: number }[])
        .map((persona) => {
          const devengado = sumar(
            obras.filter((obra) => obra.vendedor_id === persona.id),
            (obra) => obra.resumen.comision
          )
          return {
            personalId: persona.id,
            nombre: persona.nombre,
            devengado,
            pagado: persona.pagado,
            saldo: redondear(devengado - persona.pagado),
          }
        })
        .filter((fila) => fila.devengado !== 0 || fila.pagado !== 0)
        .sort((a, b) => b.saldo - a.saldo)
      return { pendiente: sumar(porPersona, (fila) => Math.max(fila.saldo, 0)), porPersona }
    },
    resumir(r) {
      return `Comisiones pendientes de pago: ${dinero(r.pendiente)}.\n${lista(
        r.porPersona.map(
          (p) => `- ${p.nombre}: generó ${dinero(p.devengado)}, cobró ${dinero(p.pagado)}, saldo ${dinero(p.saldo)}`
        ),
        'No hay comisiones cargadas.'
      )}`
    },
  }),

  pendientes: definir<'pendientes'>({
    soloDueno: true,
    usaPeriodo: false,
    descripcion:
      'Lista de lo que hay que resolver: ventas sin obra creada, cuotas para reclamar, compras vencidas, tareas vencidas y gastos fijos sin cargar.',
    async correr() {
      const sql = db()
      const hoy = todayKey()
      const periodos = [periodoDeGastoFijo('semanal', hoy), periodoDeGastoFijo('mensual', hoy)]
      const [obras, proveedores, contadores, fijos, generados] = await Promise.all([
        obrasConResumen(),
        proveedoresConCuenta(),
        sql`
          select
            (
              select count(*)::int from conversations c
              where c.site_id = 'mcp' and c.status = 'ganado' and not c.is_demo
                and not exists (
                  select 1 from obras o where o.conversation_id = c.id and o.cancelada_en is null
                )
            ) as ventas_sin_obra,
            (select count(*)::int from tareas where hecha_en is null and vence_el < ${hoy}::date) as tareas_vencidas
        `,
        sql`select id, frecuencia from gastos_fijos where activo`,
        sql`
          select gasto_fijo_id, periodo from movimientos_vigentes
          where gasto_fijo_id is not null and periodo = any(${periodos}::text[])
        `,
      ])
      const yaGenerado = new Set(
        (generados as unknown as { gasto_fijo_id: string; periodo: string }[]).map(
          (fila) => `${fila.gasto_fijo_id}:${fila.periodo}`
        )
      )
      const contador = (contadores as unknown as { ventas_sin_obra: number; tareas_vencidas: number }[])[0]

      return {
        ventasSinObra: contador.ventas_sin_obra,
        cuotasExigibles: obras.filter((obra) => obra.exigible > 0).length,
        comprasVencidas: proveedores.reduce(
          (suma, proveedor) => suma + proveedor.cuenta.compras.filter((compra) => compra.vencida).length,
          0
        ),
        tareasVencidas: contador.tareas_vencidas,
        fijosSinGenerar: (fijos as unknown as { id: string; frecuencia: FrecuenciaGasto }[]).filter(
          (fijo) => !yaGenerado.has(`${fijo.id}:${periodoDeGastoFijo(fijo.frecuencia, hoy)}`)
        ).length,
      }
    },
    resumir(r) {
      return [
        `Ventas sin obra creada: ${r.ventasSinObra}.`,
        `Obras con cuotas para reclamar: ${r.cuotasExigibles}.`,
        `Compras vencidas: ${r.comprasVencidas}.`,
        `Tareas vencidas: ${r.tareasVencidas}.`,
        `Gastos fijos sin cargar en el período actual: ${r.fijosSinGenerar}.`,
      ].join('\n')
    },
  }),
}
