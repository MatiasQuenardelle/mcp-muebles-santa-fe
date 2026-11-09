// Las reglas de plata con cifras a mano. Corre con `npm test` (node:test, sin dependencias).

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cifrasSinRespaldo,
  cuentaProveedor,
  cuotasVigentes,
  errorDeMovimiento,
  exigibleObra,
  gananciaDeCaja,
  periodoDeGastoFijo,
  rangoMes,
  rangoPeriodo,
  resumirObra,
  tipoDeCategoria,
  type Cuota,
  type MovimientoRegla,
  type ObraBase,
} from '../lib/gestion/calculos.ts'
import { parseFecha, parseMonto, parseMovimientoNuevo, textoAMonto } from '../lib/gestion/entrada.ts'
import { navActiva } from '../lib/gestion/nav.ts'

const obra = (cambios: Partial<ObraBase> = {}): ObraBase => ({
  total: 3_500_000,
  ajustes: 0,
  cobrado_inicial: 0,
  cobros: 0,
  devoluciones: 0,
  materiales: 0,
  gastos_directos: 0,
  comision_pct: 0,
  entregada_en: null,
  cancelada_en: null,
  ...cambios,
})

const compra = (id: string, total: number, fecha = '2026-10-01', vence_el: string | null = null) => ({
  id,
  fecha,
  vence_el,
  total,
})

const HOY = '2026-11-09'

test('anticipo a proveedor: descuenta la deuda de la compra que llega después', () => {
  const cuenta = cuentaProveedor(0, 200_000, [compra('c1', 500_000)], HOY)
  assert.equal(cuenta.deuda, 300_000)
  assert.equal(cuenta.compras[0].estado, 'parcial')
})

test('un solo pago salda varias compras, de la más vieja a la más nueva', () => {
  const cuenta = cuentaProveedor(
    0,
    800_000,
    [compra('nueva', 500_000, '2026-10-20'), compra('vieja', 300_000, '2026-10-01')],
    HOY
  )
  assert.equal(cuenta.deuda, 0)
  assert.deepEqual(
    cuenta.compras.map((c) => [c.id, c.estado]),
    [
      ['vieja', 'pagada'],
      ['nueva', 'pagada'],
    ]
  )
})

test('pagarle de más deja saldo a favor, no deuda negativa', () => {
  const cuenta = cuentaProveedor(0, 700_000, [compra('c1', 500_000)], HOY)
  assert.equal(cuenta.deuda, 0)
  assert.equal(cuenta.aFavor, 200_000)
})

test('lo pagado cubre primero el saldo que ya se debía', () => {
  const cuenta = cuentaProveedor(100_000, 150_000, [compra('c1', 200_000)], HOY)
  assert.equal(cuenta.saldo, 150_000)
  assert.equal(cuenta.compras[0].pagado, 50_000)
})

test('solo está vencido lo impago con fecha pasada', () => {
  const cuenta = cuentaProveedor(
    0,
    100_000,
    [compra('a', 300_000, '2026-10-01', '2026-11-01'), compra('b', 200_000, '2026-10-02', '2026-12-01')],
    HOY
  )
  assert.equal(cuenta.vencido, 200_000)
})

test('cobrar de más no descuenta lo que otra obra debe', () => {
  const a = resumirObra(obra({ cobros: 4_000_000 }))
  const b = resumirObra(obra({ cobros: 3_000_000 }))
  assert.equal(a.pendiente + b.pendiente, 500_000)
  assert.equal(a.saldoAFavor + b.saldoAFavor, 500_000)
})

test('una devolución resta de lo cobrado y no suma al costo', () => {
  const resumen = resumirObra(obra({ cobros: 1_750_000, devoluciones: 1_000_000 }))
  assert.equal(resumen.cobradoNeto, 750_000)
  assert.equal(resumen.costo, 0)
})

test('obra cancelada: nada pendiente, sin comisión, margen sobre lo cobrado', () => {
  const resumen = resumirObra(
    obra({ cobros: 1_750_000, materiales: 800_000, comision_pct: 5, cancelada_en: '2026-11-01' })
  )
  assert.equal(resumen.pendiente, 0)
  assert.equal(resumen.comision, 0)
  assert.equal(resumen.margen, 950_000)
  assert.equal(resumen.anticipo, 0)
})

test('la comisión se devenga sobre el contrato vigente y entra al costo', () => {
  const resumen = resumirObra(obra({ ajustes: 500_000, comision_pct: 5, materiales: 1_000_000 }))
  assert.equal(resumen.comision, 200_000)
  assert.equal(resumen.costo, 1_200_000)
  assert.equal(resumen.margen, 2_800_000)
})

const cuotas: Cuota[] = [
  { orden: 1, concepto: 'Inicio', monto: 1_200_000, etapa_exigible: 'medicion' },
  { orden: 2, concepto: 'Producción', monto: 800_000, etapa_exigible: 'corte' },
  { orden: 3, concepto: 'Armado', monto: 700_000, etapa_exigible: 'armado' },
  { orden: 4, concepto: 'Entrega', monto: 800_000, etapa_exigible: 'colocacion' },
]
const avance = { etapa: 'medicion' as const, entregada: false, cancelada: false }

test('si el contrato sube, la última cuota absorbe la diferencia', () => {
  const vigentes = cuotasVigentes(4_000_000, 0, cuotas, avance)
  assert.deepEqual(
    vigentes.map((c) => c.vigente),
    [1_200_000, 800_000, 700_000, 1_300_000]
  )
})

test('si el contrato baja, las últimas cuotas se achican', () => {
  const vigentes = cuotasVigentes(2_500_000, 0, cuotas, avance)
  assert.deepEqual(
    vigentes.map((c) => c.vigente),
    [1_200_000, 800_000, 500_000, 0]
  )
})

test('contrato rebajado por debajo de lo cobrado', () => {
  const resumen = resumirObra(obra({ ajustes: -1_700_000, cobros: 2_000_000 }))
  assert.equal(resumen.pendiente, 0)
  assert.equal(resumen.anticipo, 1_800_000)
  assert.equal(resumen.saldoAFavor, 200_000)
})

test('reclamable: solo las cuotas de las etapas ya alcanzadas', () => {
  const resumen = resumirObra(obra({ cobros: 1_200_000 }))
  const vigentes = cuotasVigentes(resumen.totalVigente, resumen.cobradoNeto, cuotas, { ...avance, etapa: 'corte' })
  assert.equal(exigibleObra(resumen, vigentes), 800_000)
  assert.deepEqual(
    vigentes.map((c) => c.estado),
    ['pagada', 'exigible', 'futura', 'futura']
  )
  assert.equal(resumen.pendiente, 2_300_000)
})

test('entregada sin plan de cuotas: todo el saldo se puede reclamar', () => {
  const resumen = resumirObra(obra({ cobros: 3_000_000, entregada_en: '2026-11-01' }))
  assert.equal(exigibleObra(resumen, []), 500_000)
})

test('ganancia de caja: las devoluciones van contra su propio grupo', () => {
  const ganancia = gananciaDeCaja([
    { grupo: 'ingreso', tipo: 'ingreso', total: 3_000_000 },
    { grupo: 'ingreso', tipo: 'egreso', total: 500_000 },
    { grupo: 'negocio', tipo: 'egreso', total: 1_000_000 },
    { grupo: 'negocio', tipo: 'ingreso', total: 100_000 },
    { grupo: 'familia', tipo: 'egreso', total: 200_000 },
  ])
  assert.equal(ganancia.ingresos, 2_500_000)
  assert.equal(ganancia.gastosNegocio, 900_000)
  assert.equal(ganancia.gananciaNegocio, 1_600_000)
  assert.equal(ganancia.netaLibre, 1_400_000)
})

const base: MovimientoRegla = {
  tipo: 'egreso',
  cuentaId: 'a',
  cuentaDestinoId: null,
  categoria: { grupo: 'negocio', clave: null },
  obraId: null,
  proveedorId: null,
  personalId: null,
}

test('reglas de cada movimiento', () => {
  assert.equal(errorDeMovimiento(base), null)
  assert.ok(errorDeMovimiento({ ...base, tipo: 'ingreso' }))
  assert.ok(errorDeMovimiento({ ...base, categoria: { grupo: 'familia', clave: null }, obraId: 'o' }))
  assert.ok(errorDeMovimiento({ ...base, proveedorId: 'p' }), 'un pago a proveedor necesita su categoría')
  assert.ok(errorDeMovimiento({ ...base, tipo: 'ingreso', categoria: { grupo: 'ingreso', clave: 'cobro_obra' } }))
  assert.equal(
    errorDeMovimiento({ ...base, tipo: 'ingreso', categoria: { grupo: 'ingreso', clave: 'cobro_obra' }, obraId: 'o' }),
    null
  )
  assert.equal(
    errorDeMovimiento({ ...base, categoria: { grupo: 'negocio', clave: 'pago_proveedor' }, proveedorId: 'p' }),
    null
  )
  assert.ok(
    errorDeMovimiento({
      ...base,
      categoria: { grupo: 'negocio', clave: 'pago_proveedor' },
      proveedorId: 'p',
      obraId: 'o',
    })
  )
  assert.ok(errorDeMovimiento({ ...base, tipo: 'transferencia', categoria: null }), 'falta el destino')
  assert.ok(errorDeMovimiento({ ...base, tipo: 'transferencia', categoria: null, cuentaDestinoId: 'a' }))
  assert.equal(errorDeMovimiento({ ...base, tipo: 'transferencia', categoria: null, cuentaDestinoId: 'b' }), null)
})

test('las devoluciones van al revés de su grupo', () => {
  assert.equal(tipoDeCategoria({ grupo: 'ingreso', clave: 'devolucion_cliente' }), 'egreso')
  assert.equal(tipoDeCategoria({ grupo: 'negocio', clave: 'devolucion_proveedor' }), 'ingreso')
  assert.equal(tipoDeCategoria({ grupo: 'familia', clave: null }), 'egreso')
})

test('parseMonto solo acepta números positivos', () => {
  assert.equal(parseMonto(1500.555), 1500.56)
  for (const invalido of ['abc', '1500', -5, 0, Number.NaN, Number.POSITIVE_INFINITY, null]) {
    assert.throws(() => parseMonto(invalido), `aceptó ${String(invalido)}`)
  }
})

test('textoAMonto entiende el formato argentino y rechaza lo ambiguo', () => {
  assert.equal(textoAMonto('1.500.000'), 1_500_000)
  assert.equal(textoAMonto('$ 1.500.000,50'), 1_500_000.5)
  assert.equal(textoAMonto('1500000'), 1_500_000)
  assert.equal(textoAMonto('1500,5'), 1500.5)
  for (const invalido of ['abc', '12.50', '1.50.000', '-500', '']) {
    assert.equal(textoAMonto(invalido), null, `aceptó "${invalido}"`)
  }
})

test('parseFecha rechaza fechas que no existen', () => {
  assert.equal(parseFecha('2026-02-28'), '2026-02-28')
  for (const invalida of ['2026-02-31', '2026-13-45', '09/11/2026', 20261109]) {
    assert.throws(() => parseFecha(invalida), `aceptó ${String(invalida)}`)
  }
})

test('parseMovimientoNuevo no deja pasar datos de gasto fijo', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  const movimiento = parseMovimientoNuevo({
    id,
    fecha: '2026-11-09',
    tipo: 'egreso',
    monto: 1000,
    cuentaId: id,
    categoriaId: id,
    gastoFijoId: id,
    periodo: '2026-11',
  })
  assert.equal('gastoFijoId' in movimiento, false)
  assert.equal(movimiento.cuentaDestinoId, null)
})

test('períodos', () => {
  assert.deepEqual(
    [rangoPeriodo('semana_actual', '2026-11-11').desde, rangoPeriodo('semana_actual', '2026-11-11').hastaExcl],
    ['2026-11-09', '2026-11-16']
  )
  assert.deepEqual(
    [rangoPeriodo('mes_anterior', '2026-01-15').desde, rangoPeriodo('mes_anterior', '2026-01-15').hastaExcl],
    ['2025-12-01', '2026-01-01']
  )
  assert.equal(rangoPeriodo('mes_actual', '2026-12-15').hastaExcl, '2027-01-01')
  assert.equal(rangoMes('2026-08')?.hastaExcl, '2026-09-01')
  assert.equal(rangoMes('2026-13'), null)
})

test('período de un gasto fijo', () => {
  assert.equal(periodoDeGastoFijo('mensual', '2026-11-09'), '2026-11')
  assert.equal(periodoDeGastoFijo('semanal', '2026-11-09'), '2026-W46')
  assert.equal(periodoDeGastoFijo('semanal', '2026-12-31'), '2026-W53')
  assert.equal(periodoDeGastoFijo('semanal', '2027-01-01'), '2026-W53')
})

test('el asistente no puede mostrar una cifra que no salga de un reporte', () => {
  const reporte = 'Cocina A: margen $ 2.800.000. Cocina B: margen $ 2.000.000. Vencido $ 0.'
  assert.deepEqual(cifrasSinRespaldo('El margen de la Cocina A es $ 2.800.000.', [reporte]), [])
  assert.deepEqual(cifrasSinRespaldo('Tenés $0 vencido', [reporte]), [])
  assert.deepEqual(cifrasSinRespaldo('El margen total es de $ 4.800.000.', [reporte]), ['4.800.000'])
  assert.deepEqual(cifrasSinRespaldo('Son 4.800.000 pesos', [reporte]), ['4.800.000'])
  assert.deepEqual(cifrasSinRespaldo('Unos 4,8 millones', [reporte]), ['millones'])
  assert.deepEqual(cifrasSinRespaldo('Hay 3 obras atrasadas', [reporte]), [])
})

test('navegación: prefijos con límite de segmento y el chip más específico', () => {
  assert.equal(navActiva('/admin/caja', 'owner').grupo?.id, 'plata')
  assert.equal(navActiva('/admin/caja', 'owner').chip?.label, 'Movimientos')
  assert.equal(navActiva('/admin/caja/ganancia', 'owner').chip?.label, 'Ganancia')
  assert.equal(navActiva('/admin', 'owner').chip?.label, 'Contactos')
  assert.equal(navActiva('/admin/obras/cobros', 'owner').chip?.label, 'Cobros')
  assert.equal(navActiva('/admin/obras/123', 'owner').chip?.label, 'En curso')
  assert.equal(navActiva('/admin/presupuesto/123', 'owner').chip?.label, 'Presupuestos')
  assert.equal(navActiva('/admin/equipo/tareas', 'user').grupo?.id, 'tareas')
  assert.equal(navActiva('/admin/caja', 'user').grupo, null)
})
