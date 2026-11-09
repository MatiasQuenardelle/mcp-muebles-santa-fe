import Link from 'next/link'
import type { ReactNode } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import { CLASE_CHIP_ACTIVO, CLASE_CHIP_INACTIVO, Empty, Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { countWhatsAppClicksSince, isDatabaseConfigured, listAllConversations } from '@/lib/db'
import { REPORTES, periodo } from '@/lib/gestion/reportes'
import type { Periodo, PeriodoClave, Reportes } from '@/lib/gestion/tipos'
import { listTeam, type AdminUser } from '@/lib/session'
import { porResponsable, resumenComercial, type ResumenComercial } from './comercial'
import { PanelCanales, PanelEstados, PanelSeguimientos, PanelSinContactar } from './PanelesComerciales'
import { ParaResolver, accionesParaResolver } from './ParaResolver'

const PERIODO_INICIAL: PeriodoClave = 'mes_actual'

const PERIODOS: { clave: PeriodoClave; label: string }[] = [
  { clave: 'mes_actual', label: 'Este mes' },
  { clave: 'mes_anterior', label: 'Mes pasado' },
  { clave: 'anio_actual', label: 'Este año' },
]

const PASOS_INICIALES = [
  {
    href: '/admin/caja/cuentas',
    titulo: 'Cargá las cuentas y sus saldos',
    detalle: 'Cuánta plata hay hoy en efectivo, banco y billeteras.',
  },
  {
    href: '/admin/obras/nueva',
    titulo: 'Cargá las obras en curso',
    detalle: 'Cada trabajo vendido, con su contrato y lo que ya se cobró.',
  },
  {
    href: '/admin/caja/fijos',
    titulo: 'Cargá los gastos fijos',
    detalle: 'Alquiler, sueldos y todo lo que se paga cada mes.',
  },
]

// Las fechas de un período son días de Buenos Aires (UTC-3, sin horario de verano);
// started_at es un instante.
const inicioDelDia = (dia: string) => new Date(`${dia}T00:00:00-03:00`)

async function leerDatos(user: AdminUser, rango: Periodo) {
  const desde = inicioDelDia(rango.desde)
  const hasta = inicioDelDia(rango.hastaExcl)
  const [
    ventas,
    cobranzas,
    seguimientos,
    atrasadas,
    deudaProveedores,
    ganancia,
    historia,
    cuentas,
    pendientes,
    rows,
    clicsDesde,
    clicsDespues,
    team,
  ] = await Promise.all([
    REPORTES.ventas.correr(user, rango),
    REPORTES.cobranzas.correr(user, rango),
    REPORTES.seguimientos.correr(user, rango),
    REPORTES.atrasadas.correr(user, rango),
    REPORTES.deudaProveedores.correr(user, rango),
    REPORTES.ganancia.correr(user, rango),
    // Sin recorte de fechas: un mes sin movimiento no es lo mismo que una empresa sin cargar.
    REPORTES.ganancia.correr(user, periodo('todo')),
    REPORTES.cuentas.correr(user, rango),
    REPORTES.pendientes.correr(user, rango),
    listAllConversations(user),
    countWhatsAppClicksSince(desde),
    // La consulta solo acepta un "desde": restar lo posterior acota los meses cerrados.
    countWhatsAppClicksSince(hasta),
    listTeam(),
  ])

  return {
    ventas,
    cobranzas,
    seguimientos,
    atrasadas,
    deudaProveedores,
    ganancia,
    cuentas,
    pendientes,
    team,
    clics: clicsDesde - clicsDespues,
    resumen: resumenComercial(rows, desde, hasta),
    primerUso:
      historia.porObra.length === 0 &&
      historia.ingresos === 0 &&
      historia.gastosNegocio === 0 &&
      historia.gastosFamilia === 0,
  }
}

export default async function TableroDueno({ user, periodoUrl }: { user: AdminUser; periodoUrl?: string }) {
  const clave = PERIODOS.find((item) => item.clave === periodoUrl)?.clave ?? PERIODO_INICIAL
  const rango = periodo(clave)

  if (!isDatabaseConfigured()) {
    return <Aviso>Falta conectar la base de datos para ver los números.</Aviso>
  }

  let datos: Awaited<ReturnType<typeof leerDatos>>
  try {
    datos = await leerDatos(user, rango)
  } catch (error) {
    // Es la pantalla de entrada: si falla una lectura, el menú tiene que seguir ahí.
    console.error('[admin/inicio] no se pudo armar el tablero', error)
    return <Aviso>No se pudieron leer los números. Volvé a abrir la pantalla en un rato.</Aviso>
  }

  const { primerUso, resumen, team } = datos
  const acciones = accionesParaResolver(datos)
  const responsables = porResponsable(resumen, team)

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <Cabecera />

      <div className="space-y-4">
        {primerUso ? <PrimerUso /> : null}
        {/* En el primer uso "está todo al día" sería falso: todavía no hay nada cargado. */}
        {!primerUso || acciones.length > 0 ? <ParaResolver acciones={acciones} /> : null}

        <ChipsPeriodo activo={clave} />

        {primerUso ? null : <Numeros rango={rango} datos={datos} />}

        {/* grid-cols-1 + min-w-0: sin eso la columna implícita crece al ancho de
            los resúmenes de una línea y la página se desborda en el celular. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4 min-w-0">
            <PanelSeguimientos resumen={resumen} />
            <PanelSinContactar resumen={resumen} />
          </div>

          <div className="space-y-4 min-w-0">
            <PanelConsultas rango={rango} resumen={resumen} clics={datos.clics} ventas={datos.ventas} />

            {team.length > 1 ? (
              <Panel title="Equipo">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-brand-muted text-left">
                      <th className="font-medium pb-2">Responsable</th>
                      <th className="font-medium pb-2 text-right">Abiertos</th>
                      <th className="font-medium pb-2 text-right" title="Seguimientos de hoy o vencidos">
                        Para hoy
                      </th>
                      <th className="font-medium pb-2 text-right">Ventas</th>
                      <th className="font-medium pb-2 text-right hidden sm:table-cell">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responsables.map((member) => (
                      <tr key={member.key} className="border-t border-brand-border/60">
                        <td className="py-1.5 pr-2 text-brand-dark">{member.name}</td>
                        <td className="py-1.5 text-right tabular-nums font-semibold text-brand-dark">{member.open}</td>
                        <td
                          className={`py-1.5 text-right tabular-nums ${
                            member.late > 0 ? 'font-semibold text-red-700' : 'text-brand-dark'
                          }`}
                        >
                          {member.late}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-brand-dark">{member.won}</td>
                        <td className="py-1.5 text-right tabular-nums text-brand-dark hidden sm:table-cell">
                          {member.amount ? formatMoney(member.amount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-brand-muted mt-3">
                  Ventas y monto, por consulta: contactos que entraron en el período y hoy están ganados.
                </p>
              </Panel>
            ) : null}

            <PanelEstados resumen={resumen} />

            <PanelCanales resumen={resumen} titulo="De dónde vienen (por consulta)" columnaMonto="Monto">
              <a
                href="/api/admin/export"
                className="inline-block mt-4 text-xs font-semibold text-brand-dark border border-brand-border rounded-full px-3 py-1.5 bg-white"
              >
                Descargar planilla de contactos (CSV)
              </a>
            </PanelCanales>
          </div>
        </div>
      </div>
    </main>
  )
}

function Cabecera() {
  return (
    <div className="max-w-3xl">
      <AdminHeader title="Inicio" subtitle="Cómo viene MCP" />
    </div>
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <Cabecera />
      <Panel title="Tablero">
        <Empty>{children}</Empty>
      </Panel>
    </main>
  )
}

function PrimerUso() {
  return (
    <Panel title="Para empezar">
      <p className="text-sm text-brand-muted mb-1">
        Todavía no hay obras ni movimientos. Cargá esto en orden y el tablero se completa solo.
      </p>
      <ol className="divide-y divide-brand-border/60">
        {PASOS_INICIALES.map((paso, indice) => (
          <li key={paso.href}>
            <Link href={paso.href} className="flex items-center gap-3 py-2.5 min-h-[44px]">
              <span className="w-6 h-6 rounded-full bg-brand-dark text-brand-gold text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {indice + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-brand-dark">{paso.titulo}</div>
                <div className="text-xs text-brand-muted">{paso.detalle}</div>
              </div>
              <span aria-hidden className="text-brand-muted flex-shrink-0">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

function ChipsPeriodo({ activo }: { activo: PeriodoClave }) {
  return (
    <nav aria-label="Período" className="flex flex-wrap gap-2">
      {PERIODOS.map(({ clave, label }) => (
        <Link
          key={clave}
          href={clave === PERIODO_INICIAL ? '/admin/inicio' : `/admin/inicio?p=${clave}`}
          // Los chips quedan debajo de "Para resolver": sin esto la página salta arriba.
          scroll={false}
          aria-current={clave === activo ? 'true' : undefined}
          className={`text-xs font-semibold px-3 py-2 rounded-full border ${
            clave === activo ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wide text-brand-muted mb-1">{titulo}</h3>
      {children}
    </div>
  )
}

function TileEnlace({
  href,
  className = '',
  label,
  ...tile
}: {
  href: string
  className?: string
  label: string
  value: string
  tono?: 'normal' | 'alerta'
}) {
  return (
    <Link href={href} className={`block min-w-0 rounded-xl ${className}`}>
      <Tile label={`${label} ›`} {...tile} />
    </Link>
  )
}

function Numeros({
  rango,
  datos,
}: {
  rango: Periodo
  datos: Pick<Reportes, 'ventas' | 'cobranzas' | 'deudaProveedores' | 'ganancia' | 'cuentas'>
}) {
  const { ventas, cobranzas, deudaProveedores, ganancia, cuentas } = datos
  return (
    // Sin Panel y con una columna bajo 360 px (Display Zoom incluido): con menos ancho
    // un importe de nueve cifras no entra y Tile lo corta con puntos suspensivos.
    <section aria-label="Números" className="space-y-4">
      <Grupo titulo={rango.etiqueta.charAt(0).toUpperCase() + rango.etiqueta.slice(1)}>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-2">
          <TileEnlace href="/admin/obras" label="Vendido" value={formatMoney(ventas.vendido)} />
          <TileEnlace href="/admin/obras/cobros" label="Cobrado" value={formatMoney(cobranzas.cobradoPeriodo)} />
          <TileEnlace
            href="/admin/caja/ganancia"
            className="min-[360px]:col-span-2 sm:col-span-1"
            label="Ganancia de caja del negocio"
            value={formatMoney(ganancia.gananciaNegocio)}
            tono={ganancia.gananciaNegocio < 0 ? 'alerta' : 'normal'}
          />
        </div>
        <Link href="/admin/caja/ganancia" className="block py-2 text-xs text-brand-muted">
          Gastos de la familia: <span className="tabular-nums">{formatMoney(ganancia.gastosFamilia)}</span> · Ganancia
          neta libre de caja: <strong className="text-brand-dark tabular-nums">{formatMoney(ganancia.netaLibre)}</strong>
        </Link>
        <p className="text-[11px] text-brand-muted">
          Ganancia de caja: lo que entró menos lo que salió. No es el margen de las obras.
        </p>
      </Grupo>

      <Grupo titulo="Hoy">
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2">
          <TileEnlace href="/admin/obras/cobros" label="A cobrar" value={formatMoney(cobranzas.pendiente)} />
          <TileEnlace href="/admin/obras/cobros" label="Se puede reclamar" value={formatMoney(cobranzas.exigibleAhora)} />
          <TileEnlace
            href="/admin/compras/proveedores"
            label="Deuda con proveedores"
            value={formatMoney(deudaProveedores.deuda)}
          />
          <TileEnlace
            href="/admin/caja/cuentas"
            label="En cuentas"
            value={formatMoney(cuentas.total)}
            tono={cuentas.total < 0 ? 'alerta' : 'normal'}
          />
        </div>
      </Grupo>
    </section>
  )
}

function PanelConsultas({
  rango,
  resumen,
  clics,
  ventas,
}: {
  rango: Periodo
  resumen: ResumenComercial
  clics: number
  ventas: Reportes['ventas']
}) {
  const { cohort, contacted, won, closeRate, pipelineAmount } = resumen
  return (
    <Panel title={`Consultas: ${rango.etiqueta}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Tile label="Contactos nuevos" value={String(cohort.length)} />
        <Tile
          label="Respondidos"
          value={cohort.length ? `${Math.round((contacted.length / cohort.length) * 100)} %` : '—'}
        />
        <Tile label="Clics a WhatsApp" value={String(clics)} />
        <Tile label="Ventas por consulta" value={String(won.length)} />
        <div className="col-span-2 sm:col-span-1 min-w-0">
          <Tile
            label="Tasa de cierre por consulta"
            value={closeRate === null ? '—' : `${Math.round(closeRate * 100)} %`}
            hint="ganados / (ganados + perdidos)"
          />
        </div>
      </div>
      <p className="text-[11px] text-brand-muted mt-3">
        En juego ahora (contactos abiertos con monto):{' '}
        <strong className="text-brand-dark tabular-nums">{formatMoney(pipelineAmount)}</strong>
      </p>
      <p className="text-[11px] text-brand-muted mt-1">
        Contactos que entraron {rango.etiqueta} y cómo siguen hoy. Lo vendido en plata sale de las obras:{' '}
        <strong className="text-brand-dark tabular-nums">{formatMoney(ventas.vendido)}</strong> en{' '}
        {ventas.cantidad} {ventas.cantidad === 1 ? 'obra' : 'obras'}.
      </p>
    </Panel>
  )
}
