import Link from 'next/link'
import AdminTabs from '@/components/admin/AdminTabs'
import AutoRefresh from '@/components/admin/AutoRefresh'
import CardGenerator from '@/components/admin/CardGenerator'
import FilterChips from '@/components/admin/FilterChips'
import LogoutButton from '@/components/admin/LogoutButton'
import SearchBox from '@/components/admin/SearchBox'
import {
  STATUS_LABELS,
  STATUS_STYLES,
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
  formatRelative,
  originLabel,
} from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { FILTER_LABELS, parseFilter } from '@/lib/crm'
import { getStats, isDatabaseConfigured, listConversations } from '@/lib/db'

// Siempre fresco: es un panel operativo, no puede servirse cacheado.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Consultas · Panel MCP' }

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { q?: string; f?: string }
}) {
  await requireAdminPage()

  if (!isDatabaseConfigured()) {
    return (
      <main className="px-5 py-16 max-w-lg mx-auto text-center">
        <h1 className="font-serif text-xl text-brand-dark">Falta configurar la base</h1>
        <p className="text-sm text-brand-muted mt-2">
          Definí <code className="text-brand-dark">DATABASE_URL</code> en las variables de entorno
          para empezar a ver las conversaciones.
        </p>
      </main>
    )
  }

  const search = (searchParams.q ?? '').trim()
  const filter = parseFilter(searchParams.f)
  const [conversations, stats] = await Promise.all([
    listConversations({ search, filter }),
    getStats(),
  ])

  return (
    <main className="px-4 py-6 sm:px-6 max-w-3xl mx-auto">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-dark leading-tight">Consultas</h1>
          <p className="text-sm text-brand-muted">Conversaciones del asistente de la web</p>
        </div>
        <LogoutButton />
      </header>

      <AdminTabs />

      {/* Cada métrica lleva a la lista que la explica: la idea es que se pueda
          pasar de "tengo 3 sin contactar" a las 3 conversaciones en un toque. */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <Stat label="Sin contactar" value={stats.sin_contactar} href="/admin?f=pendientes" />
        <Stat label="Chats hoy" value={stats.hoy} />
        <Stat label="Clics WhatsApp hoy" value={stats.whatsapp_hoy} href="/admin/whatsapp" />
        <Stat label="Ganados" value={stats.ganados} />
      </section>

      <SearchBox initialValue={search} filter={filter} />
      <FilterChips active={filter} search={search} />

      {/* Genera las tarjetas pendientes en segundo plano al abrir el panel. */}
      <CardGenerator />
      <AutoRefresh />

      {conversations.length === 0 ? (
        search || filter !== 'todas' ? (
          <p className="text-sm text-brand-muted text-center py-12">
            {search
              ? 'No hay consultas que coincidan con la búsqueda.'
              : `No hay consultas en "${FILTER_LABELS[filter]}".`}
          </p>
        ) : (
          <EmptyState />
        )
      ) : (
        <ul className="space-y-2.5 mt-4">
          {conversations.map((conversation) => {
            const card = conversation.card
            const nombre = card?.nombre ?? conversation.name
            const telefono = card?.telefono ?? conversation.phone
            const temperatura = card?.temperatura

            return (
              <li key={conversation.id}>
                <Link
                  href={`/admin/c/${conversation.id}`}
                  className="block bg-white rounded-2xl border border-brand-border p-4 active:bg-brand-card/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-brand-dark truncate">
                        {nombre ?? 'Sin nombre'}
                      </div>
                      {telefono ? (
                        <div className="text-sm text-brand-muted tabular-nums">{telefono}</div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          STATUS_STYLES[conversation.status] ?? STATUS_STYLES.nuevo
                        }`}
                      >
                        {STATUS_LABELS[conversation.status] ?? conversation.status}
                      </span>
                      {temperatura ? (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            TEMPERATURE_STYLES[temperatura] ?? ''
                          }`}
                        >
                          {TEMPERATURE_LABELS[temperatura] ?? temperatura}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-sm text-brand-dark/80 mt-2 line-clamp-3">
                    {card?.resumen ?? 'Resumen en preparación…'}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[11px] text-brand-muted flex-wrap">
                    <span>{formatRelative(conversation.last_message_at)}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{originLabel(conversation.attribution)}</span>
                    <span aria-hidden>·</span>
                    <span>{conversation.message_count} mensajes</span>
                    {conversation.went_to_whatsapp ? (
                      <span className="text-brand-green font-semibold">· Fue a WhatsApp</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

// Ejemplo estático para que el panel no arranque en blanco: muestra cómo se va
// a ver una consulta real. Desaparece con la primera conversación de verdad.
function EmptyState() {
  return (
    <div className="mt-4">
      <p className="text-sm text-brand-muted text-center">
        Todavía no entró ninguna consulta. Cuando alguien hable con el asistente de la web, la vas a
        ver acá así:
      </p>
      <div
        aria-hidden
        className="mt-4 bg-white rounded-2xl border border-dashed border-brand-border p-4 opacity-60 select-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-brand-dark">Sofía Ramírez</div>
            <div className="text-sm text-brand-muted tabular-nums">342 555-1234</div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES.nuevo}`}
            >
              {STATUS_LABELS.nuevo}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TEMPERATURE_STYLES.caliente}`}
            >
              {TEMPERATURE_LABELS.caliente}
            </span>
          </div>
        </div>
        <p className="text-sm text-brand-dark/80 mt-2">
          Quiere una cocina de 3,5 metros lineales en L para su departamento en Candioti. Preguntó
          por la línea Estándar y dejó el teléfono para que la llamen.
        </p>
        <div className="flex items-center gap-2 mt-3 text-[11px] text-brand-muted flex-wrap">
          <span>hace 2 h</span>
          <span aria-hidden>·</span>
          <span>Google Ads</span>
          <span aria-hidden>·</span>
          <span>8 mensajes</span>
        </div>
      </div>
      <p className="text-[11px] text-brand-muted text-center mt-3">Ejemplo</p>
    </div>
  )
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const className = 'block bg-white rounded-xl border border-brand-border px-3 py-2.5'
  const content = (
    <>
      <div className="text-xl font-semibold text-brand-dark tabular-nums">{value}</div>
      <div className="text-[11px] text-brand-muted leading-tight">{label}</div>
    </>
  )

  if (!href) {
    return <div className={className}>{content}</div>
  }
  return (
    <Link href={href} className={`${className} active:bg-brand-card/60 transition-colors`}>
      {content}
    </Link>
  )
}
