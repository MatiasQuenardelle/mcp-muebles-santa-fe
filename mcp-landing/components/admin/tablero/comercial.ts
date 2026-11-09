import { addDaysKey, leadOrigin, todayKey } from '@/lib/adminFormat'
import { CLOSED_STATUSES, CONVERSATION_STATUSES } from '@/lib/crm'
import type { ConversationRow } from '@/lib/db'

// El canal sin el detalle entre paréntesis: "Google Ads (cocinas-sf)" y
// "Google Ads (placards)" suman en la misma fila.
function channel(row: ConversationRow): string {
  return leadOrigin(row).replace(/\s*\(.*\)$/, '')
}

// Agenda y métricas por consulta. La cohorte son los contactos que entraron entre
// `desde` y `hasta` (exclusivo) y dónde están hoy: no es lo mismo que lo vendido
// en el período, que sale de las obras.
export function resumenComercial(rows: ConversationRow[], desde: Date | null, hasta: Date | null = null) {
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

  const cohort = rows.filter((row) => {
    const entrada = new Date(row.started_at)
    return (!desde || entrada >= desde) && (!hasta || entrada < hasta)
  })
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

  return {
    today,
    open,
    agenda,
    overdue,
    dueToday,
    upcoming,
    uncontacted,
    cohort,
    won,
    contacted,
    wonAmount,
    pipelineAmount,
    closeRate,
    byStatus,
    byChannel,
    maxStatus: Math.max(1, ...byStatus.map((item) => item.count)),
    maxChannel: Math.max(1, ...byChannel.map(([, item]) => item.total)),
  }
}

export type ResumenComercial = ReturnType<typeof resumenComercial>

// Para que el dueño vea quién tiene qué y quién se atrasa.
export function porResponsable(resumen: ResumenComercial, team: { id: string; name: string }[]) {
  return [...team, { id: null, name: 'Sin asignar' }].map((member) => {
    const mine = (row: ConversationRow) => row.assigned_to === member.id
    const memberWon = resumen.cohort.filter((row) => mine(row) && row.status === 'ganado')
    return {
      key: member.id ?? 'none',
      name: member.name,
      open: resumen.open.filter(mine).length,
      late: resumen.open.filter((row) => mine(row) && row.follow_up_on && row.follow_up_on <= resumen.today).length,
      won: memberWon.length,
      amount: memberWon.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    }
  })
}
