import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import { BadgeEstado, BadgePago, fechaCorta } from '@/components/admin/compras/estado'
import ListaMovimientos from '@/components/admin/gestion/ListaMovimientos'
import MovimientoForm from '@/components/admin/gestion/MovimientoForm'
import { Empty, Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { listarCompras, uuidValido } from '@/lib/gestion/compras'
import { listarMovimientos } from '@/lib/gestion/movimientos'
import { opcionesMovimiento } from '@/lib/gestion/opciones'
import { proveedoresConCuenta } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Cuenta del proveedor · Panel MCP' }

export default async function CuentaProveedorPage({ params }: { params: { id: string } }) {
  await requireOwnerPage()

  if (!uuidValido(params.id)) {
    notFound()
  }
  const [proveedores, compras, opciones, movimientos] = await Promise.all([
    proveedoresConCuenta(),
    listarCompras({ proveedorId: params.id }),
    opcionesMovimiento(),
    listarMovimientos({ proveedorId: params.id, incluirAnulados: true }),
  ])
  const proveedor = proveedores.find((candidato) => candidato.id === params.id)
  if (!proveedor) {
    notFound()
  }

  const { cuenta, comprometido, saldo_inicial: saldoInicial } = proveedor
  const comprobantes = new Map(compras.map((compra) => [compra.id, compra.comprobante]))
  // La cuenta las aplica de la más vieja a la más nueva; acá importa lo último.
  const recibidas = [...cuenta.compras].reverse()
  const pedidos = compras.filter((compra) => compra.estado === 'pedido')
  const detalle = [proveedor.rubro, proveedor.telefono, proveedor.cuit ? `CUIT ${proveedor.cuit}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title={proveedor.nombre} subtitle={detalle || 'Cuenta del proveedor'} />

      <Link href="/admin/compras/proveedores" className="inline-block mb-3 text-xs text-brand-muted underline underline-offset-2">
        ← Proveedores
      </Link>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Tile label="Le debés" value={formatMoney(cuenta.deuda)} />
        <Tile label="Vencido" value={formatMoney(cuenta.vencido)} tono={cuenta.vencido > 0 ? 'alerta' : 'normal'} />
        <Tile label="Pedidos sin recibir" value={formatMoney(comprometido)} />
        <Tile label="A favor" value={formatMoney(cuenta.aFavor)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Panel title="Compras">
          {saldoInicial > 0 ? (
            <p className="text-xs text-brand-muted mb-2">
              Además le debías {formatMoney(saldoInicial)} antes de usar el panel. Los pagos cubren eso primero.
            </p>
          ) : null}
          {recibidas.length === 0 && pedidos.length === 0 ? (
            <Empty>Todavía no hay compras de este proveedor.</Empty>
          ) : (
            <ul className="divide-y divide-brand-border/60">
              {pedidos.map((compra) => (
                <li key={compra.id}>
                  <Link href={`/admin/compras/${compra.id}`} className="block py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-xs text-brand-muted tabular-nums truncate">
                        {fechaCorta(compra.fecha)}
                        {compra.comprobante ? ` · ${compra.comprobante}` : ''}
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-brand-dark flex-shrink-0">
                        {formatMoney(compra.total)}
                      </div>
                    </div>
                    <div className="mt-1">
                      <BadgeEstado estado={compra.estado} />
                    </div>
                  </Link>
                </li>
              ))}
              {recibidas.map((compra) => {
                const comprobante = comprobantes.get(compra.id)
                return (
                  <li key={compra.id}>
                    <Link href={`/admin/compras/${compra.id}`} className="block py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 text-xs text-brand-muted tabular-nums truncate">
                          {fechaCorta(compra.fecha)}
                          {comprobante ? ` · ${comprobante}` : ''}
                        </div>
                        <div className="text-sm font-semibold tabular-nums text-brand-dark flex-shrink-0">
                          {formatMoney(compra.total)}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <BadgePago pago={compra} />
                        {compra.estado !== 'pagada' ? (
                          <span className="text-xs text-brand-muted tabular-nums">Falta {formatMoney(compra.saldo)}</span>
                        ) : null}
                        {compra.vence_el && compra.estado !== 'pagada' ? (
                          <span className={`text-xs tabular-nums ${compra.vencida ? 'font-semibold text-red-700' : 'text-brand-muted'}`}>
                            {compra.vencida ? 'Venció' : 'Vence'} {fechaCorta(compra.vence_el)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-4 min-w-0">
          <Panel title="Registrar pago">
            <MovimientoForm
              opciones={opciones}
              claveFija="pago_proveedor"
              preset={{ proveedorId: proveedor.id }}
              bloquear={['proveedorId']}
              textoBoton="Registrar pago"
            />
            <details className="mt-3 border-t border-brand-border/60 pt-3">
              <summary className="text-xs text-brand-muted underline underline-offset-2 cursor-pointer">
                ¿Te devolvió plata?
              </summary>
              <div className="mt-3">
                <MovimientoForm
                  opciones={opciones}
                  claveFija="devolucion_proveedor"
                  preset={{ proveedorId: proveedor.id }}
                  bloquear={['proveedorId']}
                  textoBoton="Registrar devolución"
                />
              </div>
            </details>
          </Panel>

          <Panel title="Pagos y devoluciones">
            <ListaMovimientos movimientos={movimientos} vacio="Todavía no le pagaste nada desde el panel." />
          </Panel>
        </div>
      </div>
    </main>
  )
}
