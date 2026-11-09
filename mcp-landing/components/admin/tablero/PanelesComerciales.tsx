// Paneles de ventas que comparten el Inicio de los empleados y el tablero del dueño.

import Link from 'next/link'
import type { ReactNode } from 'react'
import ContactAvatar from '@/components/admin/ContactAvatar'
import { Bar, Empty, Panel } from '@/components/admin/gestion/ui'
import {
  FOLLOW_UP_STYLES,
  STATUS_DOTS,
  STATUS_LABELS,
  contactView,
  followUpLabel,
  formatMoney,
  formatRelative,
  leadOrigin,
} from '@/lib/adminFormat'
import type { ConversationRow } from '@/lib/db'
import type { ResumenComercial } from './comercial'

export function PanelSeguimientos({ resumen }: { resumen: ResumenComercial }) {
  const { agenda, overdue, dueToday, upcoming } = resumen
  return (
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
  )
}

export function PanelSinContactar({ resumen }: { resumen: ResumenComercial }) {
  const { uncontacted } = resumen
  return (
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
  )
}

export function PanelEstados({ resumen }: { resumen: ResumenComercial }) {
  return (
    <Panel title="Dónde está cada contacto del período">
      {resumen.cohort.length === 0 ? (
        <Empty>No entraron contactos en este período.</Empty>
      ) : (
        <ul className="space-y-1.5">
          {resumen.byStatus.map(({ status, count }) => (
            <li key={status}>
              <Link href="/admin/embudo" className="grid grid-cols-[110px_1fr_28px] items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-brand-dark truncate">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOTS[status]}`} />
                  {STATUS_LABELS[status]}
                </span>
                <Bar value={count} max={resumen.maxStatus} />
                <span className="text-right tabular-nums text-brand-dark font-semibold">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function PanelCanales({
  resumen,
  titulo,
  columnaMonto,
  children,
}: {
  resumen: ResumenComercial
  titulo: string
  columnaMonto: string
  children?: ReactNode
}) {
  return (
    <Panel title={titulo}>
      {resumen.byChannel.length === 0 ? (
        <Empty>Sin datos en este período.</Empty>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-brand-muted text-left">
              <th className="font-medium pb-2">Origen</th>
              <th className="font-medium pb-2 w-[34%]" />
              <th className="font-medium pb-2 text-right">Contactos</th>
              <th className="font-medium pb-2 text-right">Ventas</th>
              <th className="font-medium pb-2 text-right hidden sm:table-cell">{columnaMonto}</th>
            </tr>
          </thead>
          <tbody>
            {resumen.byChannel.map(([name, item]) => (
              <tr key={name} className="border-t border-brand-border/60">
                <td className="py-1.5 pr-2 text-brand-dark">{name}</td>
                <td className="py-1.5 pr-2">
                  <Bar value={item.total} max={resumen.maxChannel} />
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
      {children}
    </Panel>
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
