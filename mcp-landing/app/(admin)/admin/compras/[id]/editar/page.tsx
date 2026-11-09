import { notFound, redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import CompraForm from '@/components/admin/compras/CompraForm'
import { fechaCorta } from '@/components/admin/compras/estado'
import { requireOwnerPage } from '@/lib/adminSession'
import { obtenerCompra, ultimosPrecios, uuidValido } from '@/lib/gestion/compras'
import { opcionesMovimiento } from '@/lib/gestion/opciones'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Editar pedido · Panel MCP' }

export default async function EditarCompraPage({ params }: { params: { id: string } }) {
  await requireOwnerPage()

  if (!uuidValido(params.id)) {
    notFound()
  }
  const [compra, opciones, ultimos] = await Promise.all([
    obtenerCompra(params.id),
    opcionesMovimiento(),
    ultimosPrecios(params.id),
  ])
  if (!compra) {
    notFound()
  }
  if (compra.estado !== 'pedido') {
    redirect(`/admin/compras/${compra.id}`)
  }

  // Las listas solo traen proveedores activos y las últimas obras: si lo cargado
  // quedó afuera, el desplegable mostraría otra cosa y guardar lo pisaría.
  const proveedores = opciones.proveedores.some((proveedor) => proveedor.id === compra.proveedor_id)
    ? opciones.proveedores
    : [...opciones.proveedores, { id: compra.proveedor_id, nombre: compra.proveedor_nombre }]
  const obras = [...opciones.obras]
  for (const item of compra.items) {
    if (item.obra_id && !obras.some((obra) => obra.id === item.obra_id)) {
      obras.push({
        id: item.obra_id,
        numero: item.obra_numero ?? '',
        titulo: item.obra_titulo ?? '',
        cliente: item.obra_cliente ?? '',
      })
    }
  }

  return (
    <main className="px-4 pt-6 sm:px-6 max-w-2xl mx-auto">
      <AdminHeader title="Editar pedido" subtitle={`${compra.proveedor_nombre} · ${fechaCorta(compra.fecha)}`} />
      <CompraForm proveedores={proveedores} obras={obras} ultimos={ultimos} compra={compra} />
    </main>
  )
}
