import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import { BadgeEstado, BadgePago, fechaCorta } from '@/components/admin/compras/estado'
import { CLASE_BOTON, CLASE_CHIP_ACTIVO, CLASE_CHIP_INACTIVO, Empty } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import type { CompraSaldo } from '@/lib/gestion/calculos'
import { LIMITE_COMPRAS, listarCompras, type CompraFila } from '@/lib/gestion/compras'
import { proveedoresConCuenta } from '@/lib/gestion/reportes'
import type { EstadoCompra } from '@/lib/gestion/tipos'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Compras · Panel MCP' }

const FILTROS: { estado: EstadoCompra | null; label: string }[] = [
  { estado: null, label: 'Todas' },
  { estado: 'pedido', label: 'Pedidos' },
  { estado: 'recibido', label: 'Recibidas' },
  { estado: 'cancelado', label: 'Canceladas' },
]

// "Vencida" es lo que dice la cuenta del proveedor: recibida, con saldo y con la
// fecha pasada. Una factura ya pagada o un pedido que no llegó no son deuda vencida.
function Vencimiento({ compra, pago }: { compra: CompraFila; pago: CompraSaldo | undefined }) {
  if (!compra.vence_el || compra.estado === 'cancelado' || pago?.estado === 'pagada') {
    return null
  }
  return (
    <span className={`text-xs tabular-nums ${pago?.vencida ? 'font-semibold text-red-700' : 'text-brand-muted'}`}>
      {pago?.vencida ? 'Venció' : 'Vence'} {fechaCorta(compra.vence_el)}
    </span>
  )
}

export default async function ComprasPage({ searchParams }: { searchParams: { estado?: string } }) {
  await requireOwnerPage()

  const activo = FILTROS.find((filtro) => filtro.estado === searchParams.estado) ?? FILTROS[0]
  const [compras, proveedores] = await Promise.all([
    listarCompras(activo.estado ? { estado: activo.estado } : {}),
    proveedoresConCuenta(),
  ])
  const pagos = new Map(
    proveedores.flatMap((proveedor) => proveedor.cuenta.compras.map((compra) => [compra.id, compra] as const))
  )

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Compras" subtitle="Pedidos, mercadería recibida y facturas" />

      <Link href="/admin/compras/nueva" className={`${CLASE_BOTON} block text-center mb-3 sm:w-56`}>
        + Nueva compra
      </Link>

      <div className="flex gap-1.5 overflow-x-auto mb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTROS.map((filtro) => (
          <Link
            key={filtro.label}
            href={filtro.estado ? `/admin/compras?estado=${filtro.estado}` : '/admin/compras'}
            scroll={false}
            aria-current={filtro === activo ? 'page' : undefined}
            className={`flex-shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border ${
              filtro === activo ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
            }`}
          >
            {filtro.label}
          </Link>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-brand-border px-4 py-1 min-w-0">
        {compras.length === 0 ? (
          <div className="py-3">
            <Empty>
              {activo.estado
                ? 'No hay compras en este estado.'
                : 'Todavía no hay compras. Cargá la primera con "Nueva compra": el proveedor se puede agregar ahí mismo.'}
            </Empty>
          </div>
        ) : (
          <ul className="divide-y divide-brand-border/60">
            {compras.map((compra) => {
              const pago = pagos.get(compra.id)
              const cancelada = compra.estado === 'cancelado'
              return (
                <li key={compra.id}>
                  <Link href={`/admin/compras/${compra.id}`} className="block py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${cancelada ? 'text-brand-muted' : 'text-brand-dark'}`}>
                          {compra.proveedor_nombre}
                        </div>
                        <div className="text-xs text-brand-muted truncate tabular-nums">
                          {fechaCorta(compra.fecha)}
                          {compra.comprobante ? ` · ${compra.comprobante}` : ''}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                          cancelada ? 'text-brand-muted line-through' : 'text-brand-dark'
                        }`}
                      >
                        {formatMoney(compra.total)}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <BadgeEstado estado={compra.estado} />
                      {pago ? <BadgePago pago={pago} /> : null}
                      <Vencimiento compra={compra} pago={pago} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {compras.length === LIMITE_COMPRAS ? (
        <p className="mt-3 text-xs text-brand-muted">Se muestran las {LIMITE_COMPRAS} más recientes.</p>
      ) : null}
    </main>
  )
}
