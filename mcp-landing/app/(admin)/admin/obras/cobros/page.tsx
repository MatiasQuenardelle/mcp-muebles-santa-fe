import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import { Empty, Panel, Tile } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'
import { requireOwnerPage } from '@/lib/adminSession'
import { REPORTES, periodo } from '@/lib/gestion/reportes'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Cobros · Panel MCP' }

export default async function CobrosPage() {
  const user = await requireOwnerPage()
  const cobranzas = await REPORTES.cobranzas.correr(user, periodo('mes_actual'))

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Cobros" subtitle="Cuánto falta cobrar y a quién reclamarle primero" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <Tile label="Pendiente" value={formatMoney(cobranzas.pendiente)} />
        <Tile
          label="Se puede reclamar"
          value={formatMoney(cobranzas.exigibleAhora)}
          tono={cobranzas.exigibleAhora > 0 ? 'alerta' : 'normal'}
        />
        <Tile label="Anticipos" value={formatMoney(cobranzas.anticipos)} hint="Cobrado de obras todavía sin entregar" />
        <Tile label="Saldos a favor" value={formatMoney(cobranzas.saldoAFavor)} hint="Cobrado de más a clientes" />
      </div>

      <Panel title="Por cliente">
        {cobranzas.obras.length === 0 ? (
          <Empty>
            No hay saldos abiertos. Cuando cargues una obra con su contrato y sus cobros, acá vas a ver a quién
            reclamarle primero.
          </Empty>
        ) : (
          <ul className="divide-y divide-brand-border/60">
            {cobranzas.obras.map((obra) => (
              <li key={obra.id}>
                <Link href={`/admin/obras/${obra.id}`} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-brand-dark truncate">{obra.cliente}</span>
                    <span className="block text-xs text-brand-muted truncate">
                      {obra.numero} · {obra.titulo}
                    </span>
                  </span>
                  <span className="text-right flex-shrink-0">
                    <span
                      className={`block text-sm font-semibold tabular-nums ${
                        obra.exigible > 0 ? 'text-red-700' : 'text-brand-dark'
                      }`}
                    >
                      {formatMoney(obra.exigible)}
                    </span>
                    <span className="block text-[11px] text-brand-muted tabular-nums">
                      {obra.saldoAFavor > 0
                        ? `A favor ${formatMoney(obra.saldoAFavor)}`
                        : `Debe ${formatMoney(obra.pendiente)}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {cobranzas.obras.length > 0 ? (
          <p className="text-[11px] text-brand-muted mt-3">
            El número grande es lo que ya se puede reclamar según la etapa de cada obra.
          </p>
        ) : null}
      </Panel>
    </main>
  )
}
