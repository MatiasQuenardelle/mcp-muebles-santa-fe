import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import CompraAcciones from '@/components/admin/compras/CompraAcciones'
import { cantidadATexto } from '@/components/admin/compras/cantidad'
import { BadgeEstado, BadgePago, fechaCorta } from '@/components/admin/compras/estado'
import { Panel } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { obtenerCompra, uuidValido } from '@/lib/gestion/compras'
import { proveedoresConCuenta } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Compra · Panel MCP' }

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-brand-muted flex-shrink-0">{label}</dt>
      <dd className="text-sm text-brand-dark text-right min-w-0 break-words">{children}</dd>
    </div>
  )
}

export default async function CompraPage({ params }: { params: { id: string } }) {
  await requireOwnerPage()

  if (!uuidValido(params.id)) {
    notFound()
  }
  const compra = await obtenerCompra(params.id)
  if (!compra) {
    notFound()
  }

  const pago =
    compra.estado === 'recibido'
      ? (await proveedoresConCuenta())
          .find((proveedor) => proveedor.id === compra.proveedor_id)
          ?.cuenta.compras.find((fila) => fila.id === compra.id)
      : undefined

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Compra" subtitle={`${compra.proveedor_nombre} · ${fechaCorta(compra.fecha)}`} />

      <Link href="/admin/compras" className="inline-block mb-3 text-xs text-brand-muted underline underline-offset-2">
        ← Compras
      </Link>

      <div className="space-y-4">
        <Panel title="Datos" action={<BadgeEstado estado={compra.estado} />}>
          <dl className="divide-y divide-brand-border/60">
            <Dato label="Proveedor">
              <Link href={`/admin/compras/proveedores/${compra.proveedor_id}`} className="underline underline-offset-2">
                {compra.proveedor_nombre}
              </Link>
            </Dato>
            <Dato label="Fecha">{fechaCorta(compra.fecha)}</Dato>
            {compra.comprobante ? <Dato label="Factura o remito">{compra.comprobante}</Dato> : null}
            {compra.vence_el ? <Dato label="Vence">{fechaCorta(compra.vence_el)}</Dato> : null}
            {compra.recibida_en ? <Dato label="Llegó el">{fechaCorta(compra.recibida_en)}</Dato> : null}
          </dl>
        </Panel>

        {pago ? (
          <Panel title="Pago" action={<BadgePago pago={pago} />}>
            <dl className="divide-y divide-brand-border/60">
              <Dato label="Pagado">
                <span className="tabular-nums">{formatMoney(pago.pagado)}</span>
              </Dato>
              <Dato label="Falta">
                <span className="tabular-nums font-semibold">{formatMoney(pago.saldo)}</span>
              </Dato>
            </dl>
            <p className="mt-2 text-xs text-brand-muted">
              Los pagos son por proveedor y cubren primero las compras más viejas.{' '}
              <Link href={`/admin/compras/proveedores/${compra.proveedor_id}`} className="underline underline-offset-2">
                Ver cuenta y pagar
              </Link>
            </p>
          </Panel>
        ) : null}

        <Panel title="Renglones">
          <ul className="divide-y divide-brand-border/60">
            {compra.items.map((item) => (
              <li key={item.id} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-brand-dark break-words">{item.descripcion}</div>
                  <div className="text-xs text-brand-muted tabular-nums">
                    {cantidadATexto(item.cantidad)} × {formatMoney(item.precio)}
                  </div>
                  {item.obra_id ? (
                    <div className="text-xs text-brand-muted break-words">
                      Obra {item.obra_numero} · {item.obra_titulo}
                    </div>
                  ) : null}
                </div>
                <div className="text-sm font-semibold tabular-nums text-brand-dark flex-shrink-0">
                  {formatMoney(item.subtotal)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-brand-border flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-brand-dark">Total</span>
            <span className="text-lg font-semibold tabular-nums text-brand-dark">{formatMoney(compra.total)}</span>
          </div>
        </Panel>

        <CompraAcciones
          id={compra.id}
          estado={compra.estado}
          fecha={compra.fecha}
          comprobante={compra.comprobante}
          venceEl={compra.vence_el}
          proveedorNombre={compra.proveedor_nombre}
        />
      </div>
    </main>
  )
}
