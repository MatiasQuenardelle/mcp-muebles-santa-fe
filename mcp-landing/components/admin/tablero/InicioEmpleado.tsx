import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import AutoRefresh from '@/components/admin/AutoRefresh'
import { Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney, todayKey } from '@/lib/adminFormat'
import { countWhatsAppClicksSince, isDatabaseConfigured, listAllConversations } from '@/lib/db'
import type { AdminUser } from '@/lib/session'
import { resumenComercial } from './comercial'
import { PanelCanales, PanelEstados, PanelSeguimientos, PanelSinContactar } from './PanelesComerciales'

const PERIODS = {
  mes: 'Este mes',
  '30': '30 días',
  '90': '90 días',
  todo: 'Todo',
} as const

type Period = keyof typeof PERIODS

function periodStart(period: Period): Date | null {
  if (period === 'todo') {
    return null
  }
  if (period === 'mes') {
    // Día 1 del mes en Buenos Aires (UTC-3, sin horario de verano).
    const [year, month] = todayKey().split('-')
    return new Date(`${year}-${month}-01T00:00:00-03:00`)
  }
  return new Date(Date.now() - Number(period) * 86_400_000)
}

export default async function InicioEmpleado({ user, periodoUrl }: { user: AdminUser; periodoUrl?: string }) {
  const period: Period = periodoUrl && periodoUrl in PERIODS ? (periodoUrl as Period) : 'mes'
  const since = periodStart(period)

  // Un usuario común ve sus números y los sin asignar.
  const [rows, whatsappClicks] = isDatabaseConfigured()
    ? await Promise.all([listAllConversations(user), countWhatsAppClicksSince(since)])
    : [[], 0]

  const resumen = resumenComercial(rows, since)
  const { cohort, contacted, won, wonAmount, pipelineAmount, closeRate } = resumen

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <AdminHeader title="Inicio" subtitle="Tus contactos y los que están sin asignar" />
      </div>

      {/* grid-cols-1 + min-w-0: sin eso la columna implícita crece al ancho de
          los resúmenes de una línea y la página se desborda en el celular. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna de acción: lo que hay que hacer. */}
        <div className="space-y-4 min-w-0">
          <PanelSeguimientos resumen={resumen} />
          <PanelSinContactar resumen={resumen} />
        </div>

        {/* Columna de números. */}
        <div className="space-y-4 min-w-0">
          <Panel
            title="Números"
            action={
              <nav className="flex gap-1">
                {(Object.keys(PERIODS) as Period[]).map((key) => (
                  <Link
                    key={key}
                    href={key === 'mes' ? '/admin/inicio' : `/admin/inicio?p=${key}`}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${
                      key === period
                        ? 'bg-brand-dark text-brand-gold border-brand-dark'
                        : 'bg-white text-brand-muted border-brand-border'
                    }`}
                  >
                    {PERIODS[key]}
                  </Link>
                ))}
              </nav>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Tile label="Contactos nuevos" value={String(cohort.length)} />
              <Tile
                label="Respondidos"
                value={cohort.length ? `${Math.round((contacted.length / cohort.length) * 100)} %` : '—'}
              />
              <Tile label="Clics a WhatsApp" value={String(whatsappClicks)} />
              <Tile label="Ventas" value={String(won.length)} />
              <Tile label="Facturado" value={formatMoney(wonAmount)} />
              <Tile
                label="Tasa de cierre"
                value={closeRate === null ? '—' : `${Math.round(closeRate * 100)} %`}
                hint="ganados / (ganados + perdidos)"
              />
            </div>
            <p className="text-[11px] text-brand-muted mt-3">
              En juego ahora (contactos abiertos con monto):{' '}
              <strong className="text-brand-dark">{formatMoney(pipelineAmount)}</strong>
            </p>
          </Panel>

          <PanelEstados resumen={resumen} />
          <PanelCanales resumen={resumen} titulo="De dónde vienen" columnaMonto="Facturado" />
        </div>
      </div>

      <AutoRefresh />
    </main>
  )
}
