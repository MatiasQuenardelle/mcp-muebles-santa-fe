import Link from 'next/link'
import { conversationHref } from '@/components/admin/ConversationList'
import { CONVERSATION_FILTERS, FILTER_LABELS, type ConversationFilter } from '@/lib/crm'

// Links y no botones: el filtro vive en la URL, así queda compartible y el
// "atrás" del celular funciona como se espera.
export default function FilterChips({
  active,
  search,
  selectedId,
}: {
  active: ConversationFilter
  search: string
  selectedId: string | null
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CONVERSATION_FILTERS.map((filter) => (
        <Link
          key={filter}
          href={conversationHref(selectedId, search, filter)}
          scroll={false}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            filter === active
              ? 'bg-brand-dark text-brand-gold border-brand-dark'
              : 'bg-white text-brand-muted border-brand-border'
          }`}
        >
          {FILTER_LABELS[filter]}
        </Link>
      ))}
    </div>
  )
}
