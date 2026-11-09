import AdminHeader from '@/components/admin/AdminHeader'
import CompraForm from '@/components/admin/compras/CompraForm'
import { requireOwnerPage } from '@/lib/adminSession'
import { ultimosPrecios } from '@/lib/gestion/compras'
import { opcionesMovimiento } from '@/lib/gestion/opciones'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Nueva compra · Panel MCP' }

export default async function NuevaCompraPage() {
  await requireOwnerPage()

  const [opciones, ultimos] = await Promise.all([opcionesMovimiento(), ultimosPrecios()])

  return (
    <main className="px-4 pt-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Nueva compra" subtitle="El total sale de la suma de los renglones" />
      <CompraForm proveedores={opciones.proveedores} obras={opciones.obras} ultimos={ultimos} />
    </main>
  )
}
