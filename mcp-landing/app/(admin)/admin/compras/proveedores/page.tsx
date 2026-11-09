import AdminHeader from '@/components/admin/AdminHeader'
import ProveedoresLista, { type ProveedorListado } from '@/components/admin/compras/ProveedoresLista'
import { Tile } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { REPORTES, periodo, proveedoresConCuenta } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Proveedores · Panel MCP' }

export default async function ProveedoresPage() {
  const user = await requireOwnerPage()

  // El reporte deja afuera a los que están en cero; la lista los necesita para editarlos.
  const [deuda, proveedores] = await Promise.all([
    REPORTES.deudaProveedores.correr(user, periodo('todo')),
    proveedoresConCuenta(),
  ])

  const filas: ProveedorListado[] = proveedores
    .map((proveedor) => ({
      id: proveedor.id,
      nombre: proveedor.nombre,
      telefono: proveedor.telefono,
      cuit: proveedor.cuit,
      rubro: proveedor.rubro,
      saldo_inicial: proveedor.saldo_inicial,
      activo: proveedor.activo,
      saldo: proveedor.cuenta.saldo,
      vencido: proveedor.cuenta.vencido,
      comprometido: proveedor.comprometido,
    }))
    .sort((a, b) => b.saldo - a.saldo || a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Proveedores" subtitle="Cuánto se le debe a cada uno y pagos" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Tile label="Deuda" value={formatMoney(deuda.deuda)} />
        <Tile label="Vencido" value={formatMoney(deuda.vencido)} tono={deuda.vencido > 0 ? 'alerta' : 'normal'} />
        <Tile label="Pedidos sin recibir" value={formatMoney(deuda.comprometido)} />
        <Tile label="A favor" value={formatMoney(deuda.aFavor)} />
      </div>

      <ProveedoresLista proveedores={filas} />
    </main>
  )
}
