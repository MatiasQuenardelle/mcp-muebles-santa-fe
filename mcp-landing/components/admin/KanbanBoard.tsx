'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ContactAvatar from '@/components/admin/ContactAvatar'
import { patchConversation } from '@/lib/adminApi'
import {
  FOLLOW_UP_STYLES,
  STATUS_DOTS,
  STATUS_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
  followUpLabel,
  formatMoneyShort,
} from '@/lib/adminFormat'
import { CLOSED_STATUSES, CONVERSATION_STATUSES, type ConversationStatus } from '@/lib/crm'

export interface KanbanItem {
  id: string
  nombre: string | null
  proyecto: string | null
  origen: string
  status: ConversationStatus
  amount: number | null
  temperatura: string | null
  followUpOn: string | null
}

// Embudo por estado. En la compu se arrastra la tarjeta de una columna a otra;
// en el celular las columnas se deslizan de costado y el estado se cambia desde
// la ficha (arrastrar con el dedo pelearía con el scroll).
export default function KanbanBoard({ items: initialItems }: { items: KanbanItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<ConversationStatus | null>(null)
  const [error, setError] = useState('')

  async function move(id: string, status: ConversationStatus) {
    const previous = items
    const item = items.find((candidate) => candidate.id === id)
    if (!item || item.status === status) {
      return
    }
    // Optimista: la tarjeta salta de columna ya, y vuelve si el server falla.
    setItems(items.map((candidate) => (candidate.id === id ? { ...candidate, status } : candidate)))
    setError('')
    const failure = await patchConversation(id, { status })
    if (failure) {
      setItems(previous)
      setError(failure)
      return
    }
    router.refresh()
  }

  return (
    <>
      {error ? <p className="text-sm text-red-700 mb-2">{error}</p> : null}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CONVERSATION_STATUSES.map((status) => {
          const column = items.filter((item) => item.status === status)
          const total = column.reduce((sum, item) => sum + (item.amount ?? 0), 0)
          const isOver = overStatus === status && dragId !== null

          return (
            <section
              key={status}
              onDragOver={(event) => {
                event.preventDefault()
                setOverStatus(status)
              }}
              onDragLeave={() => setOverStatus((current) => (current === status ? null : current))}
              onDrop={(event) => {
                event.preventDefault()
                const id = event.dataTransfer.getData('text/plain')
                setOverStatus(null)
                setDragId(null)
                if (id) {
                  move(id, status)
                }
              }}
              className={`snap-start flex-shrink-0 w-[78vw] max-w-[290px] sm:w-[260px] rounded-2xl border p-2 flex flex-col transition-colors ${
                isOver ? 'bg-brand-gold/15 border-brand-gold' : 'bg-brand-cream border-brand-border'
              }`}
            >
              <header className="px-1.5 pt-1 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOTS[status]}`} />
                  <h2 className="text-sm font-semibold text-brand-dark flex-1 truncate">
                    {STATUS_LABELS[status]}
                  </h2>
                  <span className="text-xs text-brand-muted tabular-nums">{column.length}</span>
                </div>
                <div className="text-[11px] text-brand-muted tabular-nums mt-0.5">
                  {total > 0 ? formatMoneyShort(total) : ' '}
                </div>
              </header>

              <ul className="space-y-2 min-h-[80px]">
                {column.map((item) => {
                  const followUp =
                    item.followUpOn && !CLOSED_STATUSES.includes(item.status)
                      ? followUpLabel(item.followUpOn)
                      : null
                  return (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', item.id)
                        event.dataTransfer.effectAllowed = 'move'
                        setDragId(item.id)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverStatus(null)
                      }}
                      className={`bg-white rounded-xl border border-brand-border shadow-sm cursor-grab active:cursor-grabbing ${
                        dragId === item.id ? 'opacity-40' : ''
                      }`}
                    >
                      <Link href={`/admin?c=${item.id}`} className="block p-2.5" draggable={false}>
                        <div className="flex items-center gap-2">
                          <ContactAvatar name={item.nombre} size={26} />
                          <span className="text-sm font-semibold text-brand-dark truncate flex-1">
                            {item.nombre ?? 'Sin nombre'}
                          </span>
                        </div>
                        {item.proyecto ? (
                          <p className="text-xs text-brand-dark/75 mt-1.5 line-clamp-2">
                            {item.proyecto}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {item.amount ? (
                            <span className="text-[11px] font-semibold text-brand-dark tabular-nums">
                              {formatMoneyShort(item.amount)}
                            </span>
                          ) : null}
                          {item.temperatura ? (
                            <span
                              className={`text-[10px] font-semibold px-1.5 rounded-full border ${
                                TEMPERATURE_STYLES[item.temperatura] ?? ''
                              }`}
                            >
                              {TEMPERATURE_LABELS[item.temperatura] ?? item.temperatura}
                            </span>
                          ) : null}
                          {followUp ? (
                            <span
                              className={`text-[10px] font-semibold px-1.5 rounded-full border ${FOLLOW_UP_STYLES[followUp.tone]}`}
                            >
                              ⏰ {followUp.label}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-brand-muted mt-1 truncate">{item.origen}</p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
