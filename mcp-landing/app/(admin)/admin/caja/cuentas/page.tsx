import AdminHeader from '@/components/admin/AdminHeader'
import CategoriasPanel from '@/components/admin/caja/CategoriasPanel'
import CuentasPanel from '@/components/admin/caja/CuentasPanel'
import { requireOwnerPage } from '@/lib/adminSession'
import { listarCategorias, listarCuentas } from '@/lib/gestion/caja'
import { REPORTES, periodo } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Cuentas · Panel MCP' }

export default async function CuentasPage() {
  const user = await requireOwnerPage()
  const [reporte, cuentas, categorias] = await Promise.all([
    REPORTES.cuentas.correr(user, periodo('todo')),
    listarCuentas(),
    listarCategorias(),
  ])

  // El reporte omite justamente las dadas de baja sin plata: su saldo es cero.
  const saldos = new Map(reporte.cuentas.map((cuenta) => [cuenta.id, cuenta.saldo]))
  const conSaldo = cuentas.map((cuenta) => ({ ...cuenta, saldo: saldos.get(cuenta.id) ?? 0 }))

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Cuentas" subtitle="Dónde está la plata y cómo se clasifica" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <CuentasPanel cuentas={conSaldo} total={reporte.total} />
        <CategoriasPanel categorias={categorias} />
      </div>
    </main>
  )
}
