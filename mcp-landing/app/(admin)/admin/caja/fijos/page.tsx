import AdminHeader from '@/components/admin/AdminHeader'
import CargarFijos from '@/components/admin/caja/CargarFijos'
import GastosFijosPanel from '@/components/admin/caja/GastosFijosPanel'
import { todayKey } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { listarCategorias, listarCuentas, listarGastosFijos, periodosCargados } from '@/lib/gestion/caja'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Gastos fijos · Panel MCP' }

export default async function GastosFijosPage() {
  await requireOwnerPage()
  const [gastos, categorias, cuentas, cargados] = await Promise.all([
    listarGastosFijos(),
    listarCategorias(),
    listarCuentas(),
    periodosCargados(),
  ])

  const activos = gastos.filter((gasto) => gasto.activo)
  const cuentasActivas = cuentas
    .filter((cuenta) => cuenta.activa)
    .map(({ id, nombre }) => ({ id, nombre }))

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Gastos fijos" subtitle="Lo que se paga todas las semanas o todos los meses" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {/* La key vuelve a tomar los montos de base si se edita un gasto. */}
        <CargarFijos
          key={activos.map((gasto) => `${gasto.id}:${gasto.monto}`).join('|')}
          gastos={activos}
          cuentas={cuentasActivas}
          cargados={cargados}
          hoy={todayKey()}
        />
        <GastosFijosPanel gastos={gastos} categorias={categorias} />
      </div>
    </main>
  )
}
