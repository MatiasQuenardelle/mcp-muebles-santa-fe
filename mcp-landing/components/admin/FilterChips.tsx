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
  // Una sola fila que se desliza: con 8 filtros, en el celular ocuparían tres
  // renglones del panel.
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CONVERSATION_FILTERS.map((filter) => (
        <Link
          key={filter}
          href={conversationHref(selectedId, search, filter)}
          scroll={false}
          className={`flex-shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
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
