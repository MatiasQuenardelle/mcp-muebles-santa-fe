import Link from 'next/link'
import AdminTabs from '@/components/admin/AdminTabs'
import AutoRefresh from '@/components/admin/AutoRefresh'
import CardGenerator from '@/components/admin/CardGenerator'
import ContactAvatar from '@/components/admin/ContactAvatar'
import ConversationActions from '@/components/admin/ConversationActions'
import ConversationList, { conversationHref } from '@/components/admin/ConversationList'
import FilterChips from '@/components/admin/FilterChips'
import LogoutButton from '@/components/admin/LogoutButton'
import MarkRead from '@/components/admin/MarkRead'
import NotesBox from '@/components/admin/NotesBox'
import RegenerateCardButton from '@/components/admin/RegenerateCardButton'
import SearchBox from '@/components/admin/SearchBox'
import StatusDropdown from '@/components/admin/StatusDropdown'
import Thread from '@/components/admin/Thread'
import {
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
  formatDateTime,
  formatRelative,
  originLabel,
} from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { FILTER_LABELS, parseFilter } from '@/lib/crm'
import { getConversation, getMessages, getStats, isDatabaseConfigured, listConversations } from '@/lib/db'

// Siempre fresco: es un panel operativo, no puede servirse cacheado.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Consultas · Panel MCP' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Inbox de dos paneles. La conversación abierta viaja en `?c=` y no en una ruta
 * propia porque la búsqueda (`?q=`) y el filtro (`?f=`) tienen que componerse con
 * ella, y un layout de Next 14 no recibe searchParams. Con todo en una sola page
 * los dos paneles se renderizan en el server, sin duplicar queries en rutas API.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: { q?: string; f?: string; c?: string }
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
  const selectedId = UUID_RE.test(searchParams.c ?? '') ? (searchParams.c as string) : null

  const [conversations, stats, conversation, messages] = await Promise.all([
    listConversations({ search, filter }),
    getStats(),
    selectedId ? getConversation(selectedId) : Promise.resolve(null),
    selectedId ? getMessages(selectedId) : Promise.resolve([]),
  ])

  const card = conversation?.card ?? null
  const nombre = card?.nombre ?? conversation?.name ?? null
  const telefono = card?.telefono ?? conversation?.phone ?? null

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      {/* Panel izquierdo. En mobile es la pantalla entera y se esconde cuando
          hay una conversación abierta: el condicional de clases evita tener que
          llevar el estado de navegación en el cliente. */}
      <aside
        className={`w-full md:w-[34%] md:min-w-[300px] md:max-w-[420px] flex-col border-r border-brand-border bg-brand-cream ${
          selectedId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="flex-shrink-0 px-3 pt-4 pb-3 border-b border-brand-border space-y-3">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl text-brand-dark leading-tight">Consultas</h1>
              <p className="text-xs text-brand-muted">Chats del asistente de la web</p>
            </div>
            <LogoutButton />
          </header>

          <AdminTabs />

          {/* Cada métrica lleva a la lista que la explica: la idea es que se pueda
              pasar de "tengo 3 sin contactar" a las 3 conversaciones en un toque. */}
          <section className="grid grid-cols-2 gap-2">
            <Stat label="Sin contactar" value={stats.sin_contactar} href="/admin?f=pendientes" />
            <Stat label="Chats hoy" value={stats.hoy} />
            <Stat label="Clics WhatsApp hoy" value={stats.whatsapp_hoy} href="/admin/whatsapp" />
            <Stat label="Ganados" value={stats.ganados} />
          </section>

          <SearchBox initialValue={search} filter={filter} selectedId={selectedId} />
          <FilterChips active={filter} search={search} selectedId={selectedId} />

          {/* Genera las tarjetas pendientes en segundo plano al abrir el panel. */}
          <CardGenerator />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            search || filter !== 'todas' ? (
              <p className="text-sm text-brand-muted text-center px-4 py-12">
                {search
                  ? 'No hay consultas que coincidan con la búsqueda.'
                  : `No hay consultas en "${FILTER_LABELS[filter]}".`}
              </p>
            ) : (
              <p className="text-sm text-brand-muted text-center px-4 py-12">
                Todavía no entró ninguna consulta. Cuando alguien hable con el asistente de la web,
                la vas a ver acá.
              </p>
            )
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={selectedId}
              search={search}
              filter={filter}
            />
          )}
        </div>
      </aside>

      {/* Panel derecho */}
      <section
        className={`flex-1 min-w-0 flex-col bg-brand-card ${
          selectedId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {conversation === null ? (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <p className="text-sm text-brand-muted">
              {selectedId ? 'No se encontró esa consulta.' : 'Elegí una consulta de la lista.'}
            </p>
          </div>
        ) : (
          <>
            <MarkRead key={conversation.id} id={conversation.id} unread={conversation.unread} />

            <header className="flex-shrink-0 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 border-b border-brand-border bg-brand-cream">
              <Link
                href={conversationHref(null, search, filter)}
                scroll={false}
                aria-label="Volver a la lista"
                className="md:hidden text-brand-muted text-xl leading-none px-1 flex-shrink-0"
              >
                ←
              </Link>
              <ContactAvatar name={nombre} size={40} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brand-dark truncate">
                  {nombre ?? 'Consulta sin nombre'}
                </div>
                <div className="text-xs text-brand-muted truncate tabular-nums">
                  {telefono ?? originLabel(conversation.attribution)}
                </div>
              </div>
              {card?.temperatura ? (
                <span
                  className={`hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    TEMPERATURE_STYLES[card.temperatura] ?? ''
                  }`}
                >
                  {TEMPERATURE_LABELS[card.temperatura] ?? card.temperatura}
                </span>
              ) : null}
              {/* key por conversación: sin eso, al pasar de una a otra solo
                  cambian los searchParams, React reconcilia el mismo componente
                  y el estado local queda con los datos de la anterior. Vale
                  también para el panel scrollable (notas + scroll). */}
              <StatusDropdown
                key={conversation.id}
                id={conversation.id}
                status={conversation.status}
              />
            </header>

            <div
              key={conversation.id}
              className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4"
            >
              {conversation.is_demo ? (
                <p className="text-xs text-brand-dark bg-brand-gold/15 border border-brand-gold/60 rounded-xl px-3 py-2">
                  <strong className="font-semibold">Esto es un ejemplo.</strong> Está para mostrar
                  cómo se va a ver una consulta real. Se borra solo cuando entre la primera.
                </p>
              ) : null}

              {/* Colapsada por defecto: lo primero que se quiere ver al abrir una
                  consulta es la charla. La tarjeta es salida de un modelo, así que
                  cualquier campo puede faltar y se renderiza solo lo que vino.
                  <details> nativo: sin estado en el cliente ni JS. */}
              <details className="group bg-white rounded-2xl border border-brand-border">
                <summary className="flex items-center gap-2 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <h2 className="text-sm font-semibold text-brand-dark">Tarjeta de contacto</h2>
                  <span className="text-[11px] text-brand-muted flex-1 truncate">
                    {card ? 'resumen del asistente' : 'sin resumen todavía'}
                  </span>
                  <span
                    aria-hidden
                    className="text-brand-muted text-xs transition-transform group-open:rotate-180"
                  >
                    ▼
                  </span>
                </summary>

                <div className="px-4 pb-4">
                  <div className="flex justify-end mb-3">
                    <RegenerateCardButton id={conversation.id} hasCard={card !== null} />
                  </div>

                  {card ? (
                    <>
                      <p className="text-sm text-brand-dark/85 leading-relaxed">{card.resumen}</p>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                        <Field label="Proyecto" value={card.tipo_proyecto} />
                        <Field label="Medidas" value={card.medidas} />
                        <Field label="Línea" value={card.linea_interes} />
                        <Field label="Presupuesto" value={card.presupuesto_mencionado} />
                        <Field label="Zona" value={card.zona} />
                        <Field label="Plazo" value={card.plazo} />
                        <Field label="Email" value={card.email} />
                      </dl>

                      {card.objeciones ? (
                        <Block label="Dudas / objeciones" value={card.objeciones} />
                      ) : null}
                      {card.proximo_paso ? (
                        <Block label="Próximo paso" value={card.proximo_paso} />
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-brand-muted">
                      Todavía no hay resumen. Se genera solo cuando la conversación lleva 20 minutos
                      sin actividad.
                    </p>
                  )}

                  <p className="text-[11px] text-brand-muted mt-4 pt-3 border-t border-brand-border">
                    {formatDateTime(conversation.started_at)} ·{' '}
                    {originLabel(conversation.attribution)} · {conversation.page ?? '/'}
                    {conversation.card_generated_at
                      ? ` · resumen ${formatRelative(conversation.card_generated_at)}`
                      : ''}
                    {conversation.card_message_count !== null &&
                    conversation.card_message_count < conversation.message_count
                      ? ' · la charla siguió después'
                      : ''}
                  </p>
                </div>
              </details>

              <NotesBox id={conversation.id} notes={conversation.notes ?? ''} />

              <section>
                <h2 className="text-sm font-semibold text-brand-dark mb-2">
                  Conversación completa ({messages.length} mensajes)
                </h2>
                <Thread messages={messages} />
              </section>
            </div>

            <footer className="flex-shrink-0 border-t border-brand-border bg-brand-cream px-3 sm:px-4 py-3">
              <ConversationActions
                phone={telefono}
                nombre={nombre}
                proyecto={card?.tipo_proyecto ?? null}
              />
            </footer>
          </>
        )}
      </section>

      <AutoRefresh />
    </div>
  )
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const className = 'block bg-white rounded-xl border border-brand-border px-3 py-2'
  const content = (
    <>
      <div className="text-lg font-semibold text-brand-dark tabular-nums leading-tight">{value}</div>
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

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null
  }
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="text-sm text-brand-dark">{value}</dd>
    </div>
  )
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 pt-3 border-t border-brand-border">
      <div className="text-[11px] uppercase tracking-wide text-brand-muted">{label}</div>
      <p className="text-sm text-brand-dark mt-0.5 leading-relaxed">{value}</p>
    </div>
  )
}
