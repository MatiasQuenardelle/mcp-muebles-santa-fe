import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import ListaMovimientos from '@/components/admin/gestion/ListaMovimientos'
import MovimientoForm from '@/components/admin/gestion/MovimientoForm'
import { Empty, Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { redondear } from '@/lib/gestion/calculos'
import { listarMovimientos } from '@/lib/gestion/movimientos'
import { opcionesMovimiento } from '@/lib/gestion/opciones'
import { REPORTES, periodo } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Comisiones · Panel MCP' }

const RUTA = '/admin/equipo/comisiones'

export default async function ComisionesPage({ searchParams }: { searchParams: { p?: string } }) {
  const viewer = await requireOwnerPage()
  const [reporte, opciones] = await Promise.all([
    REPORTES.comisiones.correr(viewer, periodo('todo')),
    opcionesMovimiento(),
  ])

  // Se busca entre las personas conocidas: un ?p= inventado no llega a la base.
  const conMovimiento = reporte.porPersona.find((fila) => fila.personalId === searchParams.p)
  const persona = conMovimiento
    ? { id: conMovimiento.personalId, nombre: conMovimiento.nombre }
    : (opciones.personal.find((candidata) => candidata.id === searchParams.p) ?? null)

  const pagos = persona
    ? (await listarMovimientos({ personalId: persona.id, limite: 1000 })).filter(
        (movimiento) => movimiento.categoria_clave === 'comision'
      )
    : []

  const generadas = redondear(reporte.porPersona.reduce((suma, fila) => suma + fila.devengado, 0))
  const pagadas = redondear(reporte.porPersona.reduce((suma, fila) => suma + fila.pagado, 0))

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Comisiones" subtitle="Generadas y pagadas" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4 min-w-0">
          <Panel title="Resumen">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Tile label="Falta pagar" value={formatMoney(reporte.pendiente)} />
              <Tile label="Generadas" value={formatMoney(generadas)} />
              <Tile label="Pagadas" value={formatMoney(pagadas)} />
            </div>
          </Panel>

          <Panel title="Por persona">
            {reporte.porPersona.length === 0 ? (
              <Empty>
                Todavía no hay comisiones. Se generan solas cuando una obra tiene vendedor y porcentaje de comisión.
              </Empty>
            ) : (
              <>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-brand-muted text-left">
                      <th className="font-medium pb-2">Persona</th>
                      <th className="font-medium pb-2 text-right hidden sm:table-cell">Generadas</th>
                      <th className="font-medium pb-2 text-right hidden sm:table-cell">Pagadas</th>
                      <th className="font-medium pb-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.porPersona.map((fila) => (
                      <tr key={fila.personalId} className="border-t border-brand-border/60">
                        <td className="pr-2">
                          <Link href={`${RUTA}?p=${fila.personalId}`} className="block py-2.5">
                            <span
                              className={`block text-sm text-brand-dark break-words ${
                                fila.personalId === persona?.id ? 'font-semibold underline underline-offset-2' : ''
                              }`}
                            >
                              {fila.nombre}
                            </span>
                            <span className="block sm:hidden text-[11px] text-brand-muted">
                              Generó {formatMoney(fila.devengado)} · Pagado {formatMoney(fila.pagado)}
                            </span>
                          </Link>
                        </td>
                        <td className="text-right tabular-nums text-brand-dark hidden sm:table-cell">
                          {formatMoney(fila.devengado)}
                        </td>
                        <td className="text-right tabular-nums text-brand-dark hidden sm:table-cell">
                          {formatMoney(fila.pagado)}
                        </td>
                        <td className="text-right tabular-nums font-semibold text-brand-dark">
                          {formatMoney(fila.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-brand-muted mt-3">
                  Se calcula sobre el contrato vigente de cada obra, con el porcentaje de esa obra. Tocá una persona
                  para ver sus pagos.
                </p>
              </>
            )}
          </Panel>
        </div>

        <div className="space-y-4 min-w-0">
          <Panel
            title={persona ? `Registrar pago a ${persona.nombre}` : 'Registrar pago'}
            action={
              persona ? (
                <Link href={RUTA} className="text-xs font-semibold text-brand-muted underline underline-offset-2">
                  Cambiar persona
                </Link>
              ) : null
            }
          >
            {/* key: el formulario guarda la persona en su estado inicial. Sin esto, al
                elegir a otro seguiría cargando el pago a nombre del anterior. */}
            <MovimientoForm
              key={persona?.id ?? 'sin-persona'}
              opciones={opciones}
              claveFija="comision"
              preset={persona ? { personalId: persona.id } : {}}
              bloquear={persona ? ['personalId'] : []}
              textoBoton="Registrar pago"
            />
          </Panel>

          {persona ? (
            <Panel title={`Pagos a ${persona.nombre}`}>
              <ListaMovimientos movimientos={pagos} vacio="Todavía no se le registró ningún pago de comisión." />
            </Panel>
          ) : null}
        </div>
      </div>
    </main>
  )
}
