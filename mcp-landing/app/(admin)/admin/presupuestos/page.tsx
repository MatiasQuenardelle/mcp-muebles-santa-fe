import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import { CLASE_CHIP_ACTIVO, CLASE_CHIP_INACTIVO, Empty, Panel } from '@/components/admin/gestion/ui'
import { STATUS_LABELS, STATUS_STYLES, formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { listarPresupuestosFormales, type PresupuestoListado } from '@/lib/gestion/obras'
import { formatearFecha } from '@/lib/presupuesto'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Presupuestos · Panel MCP' }

const FILTROS = {
  todos: 'Todos',
  sin_enviar: 'Sin enviar',
  enviados: 'Enviados',
  vendidos: 'Vendidos',
} as const

type Filtro = keyof typeof FILTROS

// Igual que presupuestoVendido en lib/db: si la obra se canceló, ya no cuenta.
const vendido = (p: PresupuestoListado) => p.obra_id !== null && !p.obra_cancelada

// Se excluyen entre sí: "Enviados" son los que todavía esperan respuesta.
const CUMPLE: Record<Filtro, (p: PresupuestoListado) => boolean> = {
  todos: () => true,
  sin_enviar: (p) => p.enviado_el === null && !vendido(p),
  enviados: (p) => p.enviado_el !== null && !vendido(p),
  vendidos: vendido,
}

function esFiltro(valor: string | undefined): valor is Filtro {
  return valor !== undefined && Object.hasOwn(FILTROS, valor)
}

function ChipObra({ presupuesto }: { presupuesto: PresupuestoListado }) {
  if (presupuesto.obra_id === null) {
    return <span className="text-[11px] text-brand-muted">Sin obra</span>
  }
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
        presupuesto.obra_cancelada
          ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      {presupuesto.obra_cancelada ? 'Obra cancelada' : `Obra ${presupuesto.obra_numero}`}
    </span>
  )
}

export default async function PresupuestosPage({ searchParams }: { searchParams: { f?: string } }) {
  await requireOwnerPage()
  const filtro: Filtro = esFiltro(searchParams.f) ? searchParams.f : 'todos'
  const todos = await listarPresupuestosFormales()
  const visibles = todos.filter(CUMPLE[filtro])

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Presupuestos" subtitle="Todos los presupuestos formales, del más nuevo al más viejo" />

      <nav className="flex gap-1.5 flex-wrap mb-4">
        {(Object.keys(FILTROS) as Filtro[]).map((clave) => (
          <Link
            key={clave}
            href={clave === 'todos' ? '/admin/presupuestos' : `/admin/presupuestos?f=${clave}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              clave === filtro ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
            }`}
          >
            {FILTROS[clave]} ({todos.filter(CUMPLE[clave]).length})
          </Link>
        ))}
      </nav>

      <Panel title={FILTROS[filtro]}>
        {visibles.length === 0 ? (
          <Empty>
            {todos.length === 0
              ? 'Todavía no hay presupuestos. Abrí un contacto y armá el primero desde su ficha.'
              : 'No hay presupuestos en este filtro.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-brand-border/60">
            {visibles.map((presupuesto) => (
              <li key={presupuesto.id}>
                <Link href={`/admin/presupuesto/${presupuesto.id}`} className="block py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-brand-dark truncate">{presupuesto.cliente}</p>
                    <span className="text-sm font-semibold text-brand-dark tabular-nums flex-shrink-0">
                      {formatMoney(presupuesto.total)}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted">
                    N° {presupuesto.numero} ·{' '}
                    {presupuesto.enviado_el ? `Enviado ${formatearFecha(presupuesto.enviado_el)}` : 'Sin enviar'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        STATUS_STYLES[presupuesto.contacto_estado]
                      }`}
                    >
                      {STATUS_LABELS[presupuesto.contacto_estado]}
                    </span>
                    <ChipObra presupuesto={presupuesto} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  )
}
