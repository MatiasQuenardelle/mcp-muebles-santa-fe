import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import AutoRefresh from '@/components/admin/AutoRefresh'
import ContactAvatar from '@/components/admin/ContactAvatar'
import {
  FOLLOW_UP_STYLES,
  STATUS_DOTS,
  STATUS_LABELS,
  addDaysKey,
  contactView,
  followUpLabel,
  formatMoney,
  formatRelative,
  leadOrigin,
  todayKey,
} from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { CLOSED_STATUSES, CONVERSATION_STATUSES } from '@/lib/crm'
import {
  countWhatsAppClicksSince,
  isDatabaseConfigured,
  listAllConversations,
  type ConversationRow,
} from '@/lib/db'
import { listTeam } from '@/lib/session'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Inicio · Panel MCP' }

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

// El canal sin el detalle entre paréntesis: "Google Ads (cocinas-sf)" y
// "Google Ads (placards)" suman en la misma fila.
function channel(row: ConversationRow): string {
  return leadOrigin(row).replace(/\s*\(.*\)$/, '')
}

export default async function HomePage({ searchParams }: { searchParams: { p?: string } }) {
  const user = await requireAdminPage()
  const isOwner = user.role === 'owner'

  const period: Period = searchParams.p && searchParams.p in PERIODS ? (searchParams.p as Period) : 'mes'
  const since = periodStart(period)

  // Un usuario común ve sus números y los sin asignar; el dueño, todo el negocio.
  const [rows, whatsappClicks, team] = isDatabaseConfigured()
    ? await Promise.all([
        listAllConversations(user),
        countWhatsAppClicksSince(since),
        isOwner ? listTeam() : Promise.resolve([]),
      ])
    : [[], 0, []]

  // Agenda: seguimientos abiertos hasta una semana adelante.
  const today = todayKey()
  const weekAhead = addDaysKey(7)
  const open = rows.filter((row) => !CLOSED_STATUSES.includes(row.status))
  const agenda = open
    .filter((row) => row.follow_up_on && row.follow_up_on <= weekAhead)
    .sort((a, b) => (a.follow_up_on as string).localeCompare(b.follow_up_on as string))
  const overdue = agenda.filter((row) => (row.follow_up_on as string) < today)
  const dueToday = agenda.filter((row) => row.follow_up_on === today)
  const upcoming = agenda.filter((row) => (row.follow_up_on as string) > today)
  const uncontacted = rows.filter((row) => row.status === 'nuevo')

  // Métricas: los contactos que entraron en el período y dónde están hoy.
  const cohort = since ? rows.filter((row) => new Date(row.started_at) >= since) : rows
  const won = cohort.filter((row) => row.status === 'ganado')
  const lost = cohort.filter((row) => row.status === 'perdido')
  const contacted = cohort.filter((row) => row.status !== 'nuevo')
  const wonAmount = won.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  // Lo que está en juego ahora, sin importar cuándo entró.
  const pipelineAmount = open.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const closeRate = won.length + lost.length > 0 ? won.length / (won.length + lost.length) : null

  const byStatus = CONVERSATION_STATUSES.map((status) => ({
    status,
    count: cohort.filter((row) => row.status === status).length,
  }))

  const channels = new Map<string, { total: number; won: number; amount: number }>()
  for (const row of cohort) {
    const key = channel(row)
    const entry = channels.get(key) ?? { total: 0, won: 0, amount: 0 }
    entry.total += 1
    if (row.status === 'ganado') {
      entry.won += 1
      entry.amount += row.amount ?? 0
    }
    channels.set(key, entry)
  }
  const byChannel = Array.from(channels.entries()).sort((a, b) => b[1].total - a[1].total)
  const maxStatus = Math.max(1, ...byStatus.map((item) => item.count))
  const maxChannel = Math.max(1, ...byChannel.map(([, item]) => item.total))

  // Por responsable, para que el dueño vea quién tiene qué y quién se atrasa.
  // Con una sola persona en el panel no aporta nada y no se muestra.
  const byMember = [...team, { id: null, name: 'Sin asignar' }].map((member) => {
    const mine = (row: ConversationRow) => row.assigned_to === member.id
    const memberWon = cohort.filter((row) => mine(row) && row.status === 'ganado')
    return {
      key: member.id ?? 'none',
      name: member.name,
      open: open.filter(mine).length,
      late: open.filter((row) => mine(row) && row.follow_up_on && row.follow_up_on <= today).length,
      won: memberWon.length,
      amount: memberWon.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    }
  })

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <AdminHeader
          title="Inicio"
          subtitle={
            isOwner
              ? 'Qué hay que hacer hoy y cómo viene el mes'
              : 'Tus contactos y los que están sin asignar'
          }
        />
      </div>

      {/* grid-cols-1 + min-w-0: sin eso la columna implícita crece al ancho de
          los resúmenes de una línea y la página se desborda en el celular. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna de acción: lo que hay que hacer. */}
        <div className="space-y-4 min-w-0">
          <Panel
            title="Seguimientos"
            action={
              overdue.length + dueToday.length > 0 ? (
                <Link href="/admin?f=seguimiento" className="text-xs font-semibold text-brand-muted underline underline-offset-2">
                  Ver en la lista
                </Link>
              ) : null
            }
          >
            {agenda.length === 0 ? (
              <Empty>
                No hay seguimientos agendados. Poné una fecha de próximo contacto en la ficha de cada
                cliente y te van a aparecer acá.
              </Empty>
            ) : (
              <div className="space-y-4">
                <AgendaGroup title="Vencidos" rows={overdue} />
                <AgendaGroup title="Hoy" rows={dueToday} />
                <AgendaGroup title="Próximos 7 días" rows={upcoming} />
              </div>
            )}
          </Panel>

          <Panel
            title={`Sin contactar (${uncontacted.length})`}
            action={
              uncontacted.length > 0 ? (
                <Link href="/admin?f=pendientes" className="text-xs font-semibold text-brand-muted underline underline-offset-2">
                  Ver todos
                </Link>
              ) : null
            }
          >
            {uncontacted.length === 0 ? (
              <Empty>Todos los contactos tienen respuesta. Bien ahí.</Empty>
            ) : (
              <ContactRows rows={uncontacted.slice(0, 6)} showWhen />
            )}
          </Panel>
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
                    <th className="font-medium pb-2 text-right hidden sm:table-cell">Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {byMember.map((member) => (
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
                Ventas y facturado: contactos que entraron en el período elegido arriba.
              </p>
            </Panel>
          ) : null}

          <Panel title="Dónde está cada contacto del período">
            {cohort.length === 0 ? (
              <Empty>No entraron contactos en este período.</Empty>
            ) : (
              <ul className="space-y-1.5">
                {byStatus.map(({ status, count }) => (
                  <li key={status}>
                    <Link
                      href="/admin/embudo"
                      className="grid grid-cols-[110px_1fr_28px] items-center gap-2 text-xs"
                    >
                      <span className="flex items-center gap-1.5 text-brand-dark truncate">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOTS[status]}`} />
                        {STATUS_LABELS[status]}
                      </span>
                      <Bar value={count} max={maxStatus} />
                      <span className="text-right tabular-nums text-brand-dark font-semibold">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="De dónde vienen">
            {byChannel.length === 0 ? (
              <Empty>Sin datos en este período.</Empty>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-brand-muted text-left">
                    <th className="font-medium pb-2">Origen</th>
                    <th className="font-medium pb-2 w-[34%]" />
                    <th className="font-medium pb-2 text-right">Contactos</th>
                    <th className="font-medium pb-2 text-right">Ventas</th>
                    <th className="font-medium pb-2 text-right hidden sm:table-cell">Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {byChannel.map(([name, item]) => (
                    <tr key={name} className="border-t border-brand-border/60">
                      <td className="py-1.5 pr-2 text-brand-dark">{name}</td>
                      <td className="py-1.5 pr-2">
                        <Bar value={item.total} max={maxChannel} />
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-semibold text-brand-dark">{item.total}</td>
                      <td className="py-1.5 text-right tabular-nums text-brand-dark">{item.won}</td>
                      <td className="py-1.5 text-right tabular-nums text-brand-dark hidden sm:table-cell">
                        {item.amount ? formatMoney(item.amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {isOwner ? (
              <a
                href="/api/admin/export"
                className="inline-block mt-4 text-xs font-semibold text-brand-dark border border-brand-border rounded-full px-3 py-1.5 bg-white"
              >
                Descargar planilla de contactos (CSV)
              </a>
            ) : null}
          </Panel>
        </div>
      </div>

      <AutoRefresh />
    </main>
  )
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold text-brand-dark">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-brand-muted">{children}</p>
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-cream px-3 py-2" title={hint}>
      <div className="text-lg font-semibold text-brand-dark tabular-nums leading-tight truncate">{value}</div>
      <div className="text-[11px] text-brand-muted leading-tight">{label}</div>
    </div>
  )
}

// Barra de una sola serie, con el valor siempre escrito al lado: el color no
// lleva información por sí solo.
function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-2 rounded-full bg-brand-card overflow-hidden">
      <span
        className="block h-full rounded-full bg-brand-gold"
        style={{ width: `${value === 0 ? 0 : Math.max(4, (value / max) * 100)}%` }}
      />
    </span>
  )
}

function AgendaGroup({ title, rows }: { title: string; rows: ConversationRow[] }) {
  if (rows.length === 0) {
    return null
  }
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wide text-brand-muted mb-1">
        {title} ({rows.length})
      </h3>
      <ContactRows rows={rows} />
    </div>
  )
}

function ContactRows({ rows, showWhen = false }: { rows: ConversationRow[]; showWhen?: boolean }) {
  return (
    <ul className="divide-y divide-brand-border/60">
      {rows.map((row) => {
        const contact = contactView(row)
        const followUp = row.follow_up_on ? followUpLabel(row.follow_up_on) : null
        return (
          <li key={row.id}>
            <Link href={`/admin?c=${row.id}`} className="flex items-center gap-2.5 py-2">
              <ContactAvatar name={contact.nombre} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-brand-dark truncate">
                  {contact.nombre ?? contact.telefono ?? 'Sin nombre'}
                </div>
                <div className="text-xs text-brand-muted truncate">
                  {row.follow_up_note ?? contact.proyecto ?? row.card?.resumen ?? leadOrigin(row)}
                </div>
              </div>
              {showWhen ? (
                <span className="text-[10px] text-brand-muted tabular-nums flex-shrink-0">
                  {formatRelative(row.started_at)}
                </span>
              ) : followUp ? (
                <span
                  className={`text-[10px] font-semibold px-1.5 rounded-full border flex-shrink-0 ${FOLLOW_UP_STYLES[followUp.tone]}`}
                >
                  {followUp.label}
                </span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
