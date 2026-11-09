import InicioEmpleado from '@/components/admin/tablero/InicioEmpleado'
import TableroDueno from '@/components/admin/tablero/TableroDueno'
import { requireAdminPage } from '@/lib/adminSession'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Inicio · Panel MCP' }

export default async function HomePage({ searchParams }: { searchParams: { p?: string } }) {
  // requireAdminPage y no requireOwnerPage: esa redirige acá a los que no son dueños
  // y sería un bucle.
  const user = await requireAdminPage()

  return user.role === 'owner' ? (
    <TableroDueno user={user} periodoUrl={searchParams.p} />
  ) : (
    <InicioEmpleado user={user} periodoUrl={searchParams.p} />
  )
}
