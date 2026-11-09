import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import CargarMovimiento from '@/components/admin/caja/CargarMovimiento'
import Chips from '@/components/admin/caja/Chips'
import SelectNavegacion from '@/components/admin/caja/SelectNavegacion'
import ListaMovimientos from '@/components/admin/gestion/ListaMovimientos'
import { CLASE_BOTON_SECUNDARIO, Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { PERIODOS_CHIP, PERIODO_INICIAL, leerPeriodo, listarCuentas, type PeriodoChip } from '@/lib/gestion/caja'
import { listarMovimientos } from '@/lib/gestion/movimientos'
import { opcionesMovimiento } from '@/lib/gestion/opciones'
import { REPORTES, periodo } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Caja · Panel MCP' }

const LIMITE_LISTA = 300

const GRUPOS_FILTRO = [
  { valor: null, label: 'Todo' },
  { valor: 'negocio', label: 'Negocio' },
  { valor: 'familia', label: 'Familia' },
] as const

type GrupoFiltro = (typeof GRUPOS_FILTRO)[number]['valor']

interface Filtros {
  periodo: PeriodoChip
  grupo: GrupoFiltro
  cuenta: string | null
  anulados: boolean
}

function hrefCaja(filtros: Filtros): string {
  const parametros = new URLSearchParams()
  if (filtros.periodo !== PERIODO_INICIAL) parametros.set('p', filtros.periodo)
  if (filtros.grupo) parametros.set('g', filtros.grupo)
  if (filtros.cuenta) parametros.set('c', filtros.cuenta)
  if (filtros.anulados) parametros.set('anulados', '1')
  const texto = parametros.toString()
  return texto ? `/admin/caja?${texto}` : '/admin/caja'
}

export default async function CajaPage({
  searchParams,
}: {
  searchParams: { p?: string; g?: string; c?: string; anulados?: string }
}) {
  const user = await requireOwnerPage()
  const cuentas = await listarCuentas()

  const filtros: Filtros = {
    periodo: leerPeriodo(searchParams.p),
    grupo: GRUPOS_FILTRO.find((opcion) => opcion.valor === searchParams.g)?.valor ?? null,
    cuenta: cuentas.find((cuenta) => cuenta.id === searchParams.c)?.id ?? null,
    anulados: searchParams.anulados === '1',
  }
  const rango = periodo(filtros.periodo)

  const [saldos, ganancia, gastos, opciones, movimientos] = await Promise.all([
    REPORTES.cuentas.correr(user, rango),
    REPORTES.ganancia.correr(user, rango),
    REPORTES.gastosPorCategoria.correr(user, rango),
    opcionesMovimiento(),
    listarMovimientos({
      desde: rango.desde,
      hastaExcl: rango.hastaExcl,
      grupo: filtros.grupo ?? undefined,
      cuentaId: filtros.cuenta ?? undefined,
      incluirAnulados: filtros.anulados,
      limite: LIMITE_LISTA,
    }),
  ])

  const hayFiltros = filtros.grupo !== null || filtros.cuenta !== null

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Caja" subtitle="Lo que entró, lo que salió y cuánto hay" />

      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="col-span-2 sm:col-span-1">
            <Tile
              label="Saldo total en cuentas"
              value={formatMoney(saldos.total)}
              tono={saldos.total < 0 ? 'alerta' : 'normal'}
            />
          </div>
          <Tile label={`Ingresos · ${rango.etiqueta}`} value={formatMoney(ganancia.ingresos)} />
          <Tile
            label={`Gastos · ${rango.etiqueta}`}
            value={formatMoney(gastos.total)}
            hint="Del negocio y de la familia"
          />
        </div>

        <CargarMovimiento opciones={opciones} abiertoAlInicio={movimientos.length === 0} />

        <div className="space-y-2">
          <Chips
            titulo="Período"
            opciones={PERIODOS_CHIP.map(({ clave, label }) => ({
              label,
              href: hrefCaja({ ...filtros, periodo: clave }),
              activo: clave === filtros.periodo,
            }))}
          />
          <Chips
            titulo="Grupo"
            opciones={GRUPOS_FILTRO.map(({ valor, label }) => ({
              label,
              href: hrefCaja({ ...filtros, grupo: valor }),
              activo: valor === filtros.grupo,
            }))}
          />
          <div className="max-w-xs">
            <SelectNavegacion
              etiqueta="Cuenta"
              actual={hrefCaja(filtros)}
              opciones={[
                { label: 'Todas las cuentas', href: hrefCaja({ ...filtros, cuenta: null }) },
                ...cuentas.map((cuenta) => ({
                  label: cuenta.activa ? cuenta.nombre : `${cuenta.nombre} (dada de baja)`,
                  href: hrefCaja({ ...filtros, cuenta: cuenta.id }),
                })),
              ]}
            />
          </div>
        </div>

        <Panel
          title="Movimientos"
          action={
            <Link href={hrefCaja({ ...filtros, anulados: !filtros.anulados })} scroll={false} className={CLASE_BOTON_SECUNDARIO}>
              {filtros.anulados ? 'Ocultar anulados' : 'Ver anulados'}
            </Link>
          }
        >
          <ListaMovimientos
            movimientos={movimientos}
            vacio={
              hayFiltros
                ? 'No hay movimientos con estos filtros.'
                : `No hay movimientos cargados ${rango.etiqueta}. Cargá el primero desde "Cargar movimiento".`
            }
          />
          {movimientos.length === LIMITE_LISTA ? (
            <p className="mt-2 text-xs text-brand-muted">
              Se ven los últimos {LIMITE_LISTA}. Elegí un período más corto para ver el resto.
            </p>
          ) : null}
        </Panel>
      </div>
    </main>
  )
}
