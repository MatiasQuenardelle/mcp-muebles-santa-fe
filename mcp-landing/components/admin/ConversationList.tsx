import Link from 'next/link'
import ContactAvatar from '@/components/admin/ContactAvatar'
import {
  STATUS_DOTS,
  STATUS_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
  formatRelative,
} from '@/lib/adminFormat'
import type { ConversationFilter } from '@/lib/crm'
import type { ConversationRow } from '@/lib/db'

// La selección viaja en `?c=`, no en la ruta: así la búsqueda y el filtro que
// ya viven en la URL siguen valiendo al abrir una conversación.
export function conversationHref(
  id: string | null,
  search: string,
  filter: ConversationFilter
): string {
  const params = new URLSearchParams()
  if (search) {
    params.set('q', search)
  }
  if (filter !== 'todas') {
    params.set('f', filter)
  }
  if (id) {
    params.set('c', id)
  }
  const query = params.toString()
  return query ? `/admin?${query}` : '/admin'
}

export default function ConversationList({
  conversations,
  activeId,
  search,
  filter,
}: {
  conversations: ConversationRow[]
  activeId: string | null
  search: string
  filter: ConversationFilter
}) {
  return (
    <ul>
      {conversations.map((conversation) => {
        const card = conversation.card
        const nombre = card?.nombre ?? conversation.name
        const telefono = card?.telefono ?? conversation.phone
        const temperatura = card?.temperatura
        const isActive = conversation.id === activeId

        return (
          <li key={conversation.id}>
            <Link
              href={conversationHref(conversation.id, search, filter)}
              scroll={false}
              className={`flex items-start gap-3 px-3 py-2.5 border-b border-brand-border/60 transition-colors ${
                isActive
                  ? 'bg-brand-card border-l-2 border-l-brand-gold pl-[10px]'
                  : 'hover:bg-brand-card/50 active:bg-brand-card/70'
              }`}
            >
              <div className="mt-0.5">
                <ContactAvatar name={nombre} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm truncate ${
                      conversation.unread
                        ? 'font-semibold text-brand-dark'
                        : 'font-medium text-brand-dark/75'
                    }`}
                  >
                    {nombre ?? telefono ?? 'Sin nombre'}
                  </span>
                  <span className="text-[10px] text-brand-muted flex-shrink-0 tabular-nums">
                    {formatRelative(conversation.last_message_at)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-brand-muted truncate flex-1">
                    {card?.resumen ?? 'Resumen en preparación…'}
                  </p>
                  {conversation.unread ? (
                    <span
                      aria-label="Sin leer"
                      className="w-2 h-2 rounded-full bg-brand-gold flex-shrink-0"
                    />
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 mt-1.5">
                  {conversation.is_demo ? (
                    <span className="text-[10px] font-bold px-1.5 rounded-full bg-brand-gold/20 text-brand-dark border border-brand-gold/60">
                      EJEMPLO
                    </span>
                  ) : null}
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      STATUS_DOTS[conversation.status] ?? STATUS_DOTS.nuevo
                    }`}
                  />
                  <span className="text-[10px] text-brand-muted">
                    {STATUS_LABELS[conversation.status] ?? conversation.status}
                  </span>
                  {temperatura ? (
                    <span
                      className={`text-[10px] font-semibold px-1.5 rounded-full border ${
                        TEMPERATURE_STYLES[temperatura] ?? ''
                      }`}
                    >
                      {TEMPERATURE_LABELS[temperatura] ?? temperatura}
                    </span>
                  ) : null}
                  {conversation.went_to_whatsapp ? (
                    <span className="text-[10px] font-semibold text-brand-green">WhatsApp</span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
