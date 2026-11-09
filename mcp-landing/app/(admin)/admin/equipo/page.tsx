import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import PersonalPanel from '@/components/admin/equipo/PersonalPanel'
import { CLASE_CHIP_ACTIVO, CLASE_CHIP_INACTIVO, Empty, Panel } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { armarRendimiento, contarTareasPorPersona, listarPersonal, type FilaRendimiento } from '@/lib/gestion/equipo'
import { REPORTES, periodo } from '@/lib/gestion/reportes'
import { listTeam } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Equipo · Panel MCP' }

const CHIPS = [
  { param: 'mes', clave: 'mes_actual', label: 'Este mes' },
  { param: 'anterior', clave: 'mes_anterior', label: 'Mes anterior' },
  { param: 'anio', clave: 'anio_actual', label: 'Este año' },
] as const

export default async function EquipoPage({ searchParams }: { searchParams: { p?: string } }) {
  const viewer = await requireOwnerPage()
  const chip = CHIPS.find((candidato) => candidato.param === searchParams.p) ?? CHIPS[0]
  const rango = periodo(chip.clave)

  const [personas, equipo, ventas, tareas] = await Promise.all([
    listarPersonal(),
    listTeam(),
    REPORTES.ventas.correr(viewer, rango),
    contarTareasPorPersona(rango),
  ])

  const vinculadas = new Set(personas.map((persona) => persona.user_id))
  const cuentasLibres = equipo.filter((cuenta) => !vinculadas.has(cuenta.id))
  const rendimiento = armarRendimiento(personas, ventas, tareas)

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Equipo" subtitle="Personal y rendimiento" />

      <div className="space-y-4 min-w-0">
        <PersonalPanel personas={personas} cuentasLibres={cuentasLibres} />

        <Panel
          title="Rendimiento"
          action={
            <nav className="flex gap-1">
              {CHIPS.map((opcion) => (
                <Link
                  key={opcion.param}
                  href={opcion.param === 'mes' ? '/admin/equipo' : `/admin/equipo?p=${opcion.param}`}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${
                    opcion.param === chip.param ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
                  }`}
                >
                  {opcion.label}
                </Link>
              ))}
            </nav>
          }
        >
          {rendimiento.length === 0 ? (
            <Empty>Cuando cargues al personal, acá vas a ver las ventas y las tareas de cada uno.</Empty>
          ) : (
            <>
              <ul className="divide-y divide-brand-border/60">
                {rendimiento.map((fila) => (
                  <FilaDeRendimiento key={fila.personalId ?? 'sin'} fila={fila} />
                ))}
              </ul>
              <p className="text-[11px] text-brand-muted mt-3">
                Ventas y tareas hechas: {rango.etiqueta}. Abiertas y vencidas: a hoy.
              </p>
            </>
          )}
        </Panel>
      </div>
    </main>
  )
}

function FilaDeRendimiento({ fila }: { fila: FilaRendimiento }) {
  const huboVentas = fila.ventas > 0 || fila.vendido !== 0
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-brand-dark truncate">{fila.nombre}</div>
          {fila.puesto ? <div className="text-[11px] text-brand-muted truncate">{fila.puesto}</div> : null}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-brand-dark tabular-nums">
            {huboVentas ? formatMoney(fila.vendido) : '—'}
          </div>
          <div className="text-[11px] text-brand-muted tabular-nums">
            {fila.ventas === 1 ? '1 venta' : `${fila.ventas} ventas`}
          </div>
        </div>
      </div>
      {fila.personalId ? (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <Dato label="Abiertas" valor={fila.abiertas} />
          <Dato label="Vencidas" valor={fila.vencidas} alerta={fila.vencidas > 0} />
          <Dato label="Hechas" valor={fila.hechas} />
        </div>
      ) : null}
    </li>
  )
}

function Dato({ label, valor, alerta = false }: { label: string; valor: number; alerta?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 min-w-0 ${alerta ? 'bg-red-50' : 'bg-brand-cream'}`}>
      <div className={`text-sm font-semibold tabular-nums leading-tight ${alerta ? 'text-red-700' : 'text-brand-dark'}`}>
        {valor}
      </div>
      <div className="text-[11px] text-brand-muted leading-tight">{label}</div>
    </div>
  )
}
