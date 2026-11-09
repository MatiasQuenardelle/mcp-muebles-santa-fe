import AdminHeader from '@/components/admin/AdminHeader'
import TareasPanel from '@/components/admin/equipo/TareasPanel'
import { Empty, Panel } from '@/components/admin/gestion/ui'
import { todayKey } from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { listarTareas, opcionesTarea, personaDeCuenta } from '@/lib/gestion/equipo'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Tareas · Panel MCP' }

export default async function TareasPage({
  searchParams,
}: {
  searchParams: { persona?: string; hechas?: string }
}) {
  const viewer = await requireAdminPage()
  const esDueno = viewer.role === 'owner'
  const subtitulo = esDueno ? 'Quién hace qué' : 'Lo que tenés que hacer'

  if (!esDueno && !(await personaDeCuenta(viewer.id))) {
    return (
      <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
        <AdminHeader title="Tareas" subtitle={subtitulo} />
        <Panel title="Tus tareas">
          <Empty>
            Tu cuenta no está vinculada a ninguna persona del equipo, así que no podés ver tareas. Pedile a un dueño
            que te vincule desde Equipo.
          </Empty>
        </Panel>
      </main>
    )
  }

  const opciones = esDueno ? await opcionesTarea() : null
  // Solo valores conocidos: lo que venga en la URL nunca llega a un cast de la base.
  const persona = searchParams.persona ?? ''
  const filtroPersona =
    persona === 'sin' || opciones?.personal.some((candidata) => candidata.id === persona) ? persona : ''
  const verHechas = searchParams.hechas === '1'

  const tareas = await listarTareas(viewer, {
    persona: esDueno ? filtroPersona || null : null,
    incluirHechas: verHechas,
  })

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Tareas" subtitle={subtitulo} />
      <TareasPanel
        tareas={tareas}
        hoy={todayKey()}
        opciones={opciones}
        filtroPersona={filtroPersona}
        verHechas={verHechas}
      />
    </main>
  )
}
