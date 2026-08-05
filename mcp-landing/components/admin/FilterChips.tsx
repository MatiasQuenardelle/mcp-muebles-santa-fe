import Link from 'next/link'
import { CONVERSATION_FILTERS, FILTER_LABELS, type ConversationFilter } from '@/lib/crm'

// Links y no botones: el filtro vive en la URL, así queda compartible y el
// "atrás" del celular funciona como se espera.
export default function FilterChips({
  active,
  search,
}: {
  active: ConversationFilter
  search: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {CONVERSATION_FILTERS.map((filter) => {
        const params = new URLSearchParams()
        if (search) {
          params.set('q', search)
        }
        if (filter !== 'todas') {
          params.set('f', filter)
        }
        const query = params.toString()

        return (
          <Link
            key={filter}
            href={query ? `/admin?${query}` : '/admin'}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === active
                ? 'bg-brand-dark text-brand-gold border-brand-dark'
                : 'bg-white text-brand-muted border-brand-border'
            }`}
          >
            {FILTER_LABELS[filter]}
          </Link>
        )
      })}
    </div>
  )
}
