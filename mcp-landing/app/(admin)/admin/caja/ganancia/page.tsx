import AdminHeader from '@/components/admin/AdminHeader'
import Chips from '@/components/admin/caja/Chips'
import SelectNavegacion from '@/components/admin/caja/SelectNavegacion'
import { Bar, Empty, Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney, todayKey } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { rangoMes } from '@/lib/gestion/calculos'
import { PERIODOS_CHIP, PERIODO_INICIAL, leerPeriodo, type PeriodoChip } from '@/lib/gestion/caja'
import { REPORTES, periodo } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Ganancia · Panel MCP' }

const BASE = '/admin/caja/ganancia'
const MESES_PARA_ELEGIR = 24

const hrefPeriodo = (clave: PeriodoChip) => (clave === PERIODO_INICIAL ? BASE : `${BASE}?p=${clave}`)
const hrefMes = (mes: string) => `${BASE}?mes=${mes}`

function mesesRecientes(hoy: string): string[] {
  const anio = Number(hoy.slice(0, 4))
  const mes = Number(hoy.slice(5, 7)) - 1
  return Array.from({ length: MESES_PARA_ELEGIR }, (_, atras) =>
    new Date(Date.UTC(anio, mes - atras, 1)).toISOString().slice(0, 7)
  )
}

export default async function GananciaPage({ searchParams }: { searchParams: { p?: string; mes?: string } }) {
  const user = await requireOwnerPage()

  const mesPedido = typeof searchParams.mes === 'string' ? searchParams.mes : ''
  const rangoDelMes = rangoMes(mesPedido)
  const periodoClave = leerPeriodo(searchParams.p)
  const rango = rangoDelMes ?? periodo(periodoClave)

  const [ganancia, gastos] = await Promise.all([
    REPORTES.ganancia.correr(user, rango),
    REPORTES.gastosPorCategoria.correr(user, rango),
  ])

  const meses = mesesRecientes(todayKey())
  if (rangoDelMes && !meses.includes(mesPedido)) {
    meses.push(mesPedido)
  }
  const hrefSinMes = rangoDelMes ? BASE : hrefPeriodo(periodoClave)

  // "recibidos este mes" pero "recibidos en octubre 2026".
  const cuando = rangoDelMes ? `en ${rango.etiqueta}` : rango.etiqueta

  const maximo = Math.max(0, ...gastos.categorias.map((categoria) => categoria.total))
  const secciones = [
    { grupo: 'negocio', titulo: 'Negocio', total: ganancia.gastosNegocio },
    { grupo: 'familia', titulo: 'Familia', total: ganancia.gastosFamilia },
  ] as const

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Ganancia" subtitle={`Caja de ${rango.etiqueta}`} />

      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_16rem] gap-2 sm:items-end">
          <Chips
            titulo="Período"
            opciones={PERIODOS_CHIP.map(({ clave, label }) => ({
              label,
              href: hrefPeriodo(clave),
              activo: !rangoDelMes && clave === periodoClave,
            }))}
          />
          <SelectNavegacion
            etiqueta="Un mes puntual"
            actual={rangoDelMes ? hrefMes(mesPedido) : hrefSinMes}
            opciones={[
              { label: 'Elegir mes…', href: hrefSinMes },
              ...meses.map((mes) => ({ label: rangoMes(mes)?.etiqueta ?? mes, href: hrefMes(mes) })),
            ]}
          />
        </div>

        <section className="rounded-2xl bg-brand-dark p-5 min-w-0">
          <h2 className="text-xs text-brand-muted-dark">Ganancia del negocio · {rango.etiqueta}</h2>
          <p
            className={`mt-1 font-serif text-4xl tabular-nums break-words ${
              ganancia.gananciaNegocio < 0 ? 'text-red-300' : 'text-brand-gold'
            }`}
          >
            {formatMoney(ganancia.gananciaNegocio)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-brand-muted-dark">
            <div>
              <dt>Ingresos</dt>
              <dd className="text-sm tabular-nums text-brand-cream">{formatMoney(ganancia.ingresos)}</dd>
            </div>
            <div>
              <dt>Gastos del negocio</dt>
              <dd className="text-sm tabular-nums text-brand-cream">{formatMoney(ganancia.gastosNegocio)}</dd>
            </div>
          </dl>
        </section>

        <Panel title="Después de la familia">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Gastos de la familia" value={formatMoney(ganancia.gastosFamilia)} />
            <Tile
              label="Ganancia neta libre"
              value={formatMoney(ganancia.netaLibre)}
              tono={ganancia.netaLibre < 0 ? 'alerta' : 'normal'}
            />
          </div>
        </Panel>

        <Panel title="En qué se gastó">
          {gastos.categorias.length === 0 ? (
            <Empty>No hay gastos cargados {cuando}. Se cargan desde Movimientos o Gastos fijos.</Empty>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
              {secciones.map(({ grupo, titulo, total }) => {
                const categorias = gastos.categorias.filter((categoria) => categoria.grupo === grupo)
                return categorias.length === 0 ? null : (
                  <div key={grupo} className="min-w-0">
                    <h3 className="flex justify-between gap-2 text-[11px] uppercase tracking-wide text-brand-muted mb-1.5">
                      <span>{titulo}</span>
                      <span className="tabular-nums">{formatMoney(total)}</span>
                    </h3>
                    <ul className="space-y-2">
                      {categorias.map((categoria) => (
                        <li key={categoria.id} className="min-w-0">
                          <div className="flex justify-between gap-2 text-sm text-brand-dark">
                            <span className="truncate">{categoria.nombre}</span>
                            <span className="tabular-nums flex-shrink-0">{formatMoney(categoria.total)}</span>
                          </div>
                          {/* Una devolución de proveedor da negativo: la barra no puede representarlo. */}
                          <Bar value={Math.max(categoria.total, 0)} max={maximo} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        <section className="mt-4 pt-4 border-t border-brand-border min-w-0">
          <h2 className="font-serif text-xl text-brand-dark leading-tight">Margen por obra</h2>
          <p className="mt-1 mb-3 text-xs text-brand-muted">
            La ganancia de caja cuenta lo que entró y salió en el período; el margen cuenta lo que dejó cada obra. No se
            suman entre sí.
          </p>
          <div className="bg-white rounded-2xl border border-brand-border p-4 min-w-0">
            {ganancia.porObra.length === 0 ? (
              <Empty>No hay obras en curso ni cerradas {cuando}.</Empty>
            ) : (
              <ul className="divide-y divide-brand-border/60">
                {ganancia.porObra.map((obra) => (
                  <li key={obra.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-brand-dark truncate">{obra.titulo}</div>
                        <div className="text-xs text-brand-muted truncate">
                          {obra.numero} · {obra.cancelada ? 'Cancelada' : obra.entregada ? 'Entregada' : 'En curso'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-sm font-semibold tabular-nums ${
                            obra.margen < 0 ? 'text-red-700' : 'text-brand-dark'
                          }`}
                        >
                          {formatMoney(obra.margen)}
                        </div>
                        <div className="text-[11px] text-brand-muted">margen</div>
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs text-brand-muted tabular-nums">
                      Contrato {formatMoney(obra.contrato)} · Costo {formatMoney(obra.costo)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {ganancia.materialesSinObra !== 0 ? (
            <p className="mt-2 text-xs text-brand-muted">
              Hay {formatMoney(ganancia.materialesSinObra)} de materiales recibidos {cuando} sin asignar a ninguna obra:
              no están en el costo de ninguna.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  )
}
