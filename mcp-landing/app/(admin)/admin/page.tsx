import Link from 'next/link'
import ActivityLog from '@/components/admin/ActivityLog'
import AdminHeader from '@/components/admin/AdminHeader'
import AssigneeBox from '@/components/admin/AssigneeBox'
import AutoRefresh from '@/components/admin/AutoRefresh'
import CardGenerator from '@/components/admin/CardGenerator'
import ContactAvatar from '@/components/admin/ContactAvatar'
import ContactDetails from '@/components/admin/ContactDetails'
import ConversationActions from '@/components/admin/ConversationActions'
import ConversationList, { conversationHref } from '@/components/admin/ConversationList'
import FilterChips from '@/components/admin/FilterChips'
import FollowUpBox from '@/components/admin/FollowUpBox'
import MarkRead from '@/components/admin/MarkRead'
import PresupuestosBox from '@/components/admin/PresupuestosBox'
import RegenerateCardButton from '@/components/admin/RegenerateCardButton'
import SearchBox from '@/components/admin/SearchBox'
import StatusDropdown from '@/components/admin/StatusDropdown'
import Thread from '@/components/admin/Thread'
import {
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
  contactView,
  formatDateTime,
  formatRelative,
  leadOrigin,
} from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { CLOSED_STATUSES, FILTER_LABELS, parseFilter } from '@/lib/crm'
import {
  getConversation,
  getMessages,
  getStats,
  isDatabaseConfigured,
  listActivities,
  listConversations,
  listPresupuestos,
} from '@/lib/db'
import { listTeam } from '@/lib/session'

// Siempre fresco: es un panel operativo, no puede servirse cacheado.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Contactos · Panel MCP' }

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
  const user = await requireAdminPage()

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

  const isOwner = user.role === 'owner'
  // Mensajes e historial se piden solo si getConversation dice que lo puede ver.
  const [conversations, stats, conversation, team] = await Promise.all([
    listConversations({ viewer: user, search, filter }),
    getStats(user),
    selectedId ? getConversation(selectedId, user) : Promise.resolve(null),
    isOwner ? listTeam() : Promise.resolve(null),
  ])
  const [messages, activities, presupuestos] = conversation
    ? await Promise.all([
        getMessages(conversation.id),
        listActivities(conversation.id),
        listPresupuestos(conversation.id),
      ])
    : [[], [], []]

  const card = conversation?.card ?? null
  const contact = conversation ? contactView(conversation) : null
  const isChat = conversation?.source === 'chat'

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      {/* Panel izquierdo. En mobile es la pantalla entera y se esconde cuando
          hay una conversación abierta: el condicional de clases evita tener que
          llevar el estado de navegación en el cliente. */}
      <aside
        className={`w-full md:w-[34%] md:min-w-[320px] md:max-w-[420px] flex-col border-r border-brand-border bg-brand-cream ${
          selectedId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="flex-shrink-0 px-3 pt-4 pb-3 border-b border-brand-border space-y-3">
          <AdminHeader title="Contactos" subtitle="Chats de la web y contactos cargados a mano" />

          {/* Cada métrica lleva a la lista que la explica: la idea es que se pueda
              pasar de "tengo 3 sin contactar" a las 3 conversaciones en un toque. */}
          <section className="grid grid-cols-2 gap-2">
            <Stat label="Sin contactar" value={stats.sin_contactar} href="/admin?f=pendientes" />
            <Stat
              label="Seguimientos para hoy"
              value={stats.seguimiento_hoy}
              href="/admin?f=seguimiento"
              highlight={stats.seguimiento_hoy > 0}
            />
            <Stat label="Chats hoy" value={stats.hoy} />
            <Stat label="Clics WhatsApp hoy" value={stats.whatsapp_hoy} href="/admin/whatsapp" />
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
                  ? 'No hay contactos que coincidan con la búsqueda.'
                  : `No hay contactos en "${FILTER_LABELS[filter]}".`}
              </p>
            ) : (
              <p className="text-sm text-brand-muted text-center px-4 py-12">
                Todavía no hay contactos. Cuando alguien hable con el asistente de la web lo vas a
                ver acá, o cargá uno con <strong>+ Nuevo</strong>.
              </p>
            )
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={selectedId}
              search={search}
              filter={filter}
              viewerId={user.id}
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
        {conversation === null || contact === null ? (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <p className="text-sm text-brand-muted">
              {selectedId ? 'No se encontró ese contacto.' : 'Elegí un contacto de la lista.'}
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
              <ContactAvatar name={contact.nombre} size={40} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brand-dark truncate">
                  {contact.nombre ?? 'Contacto sin nombre'}
                </div>
                <div className="text-xs text-brand-muted truncate tabular-nums">
                  {contact.telefono ?? leadOrigin(conversation)}
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
                  también para el panel scrollable. key con el estado: si un
                  registro del historial lo avanza, el select se rearma. */}
              <StatusDropdown
                key={`${conversation.id}:${conversation.status}`}
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

              <AssigneeBox
                key={`as:${conversation.assigned_to}`}
                id={conversation.id}
                assignedTo={conversation.assigned_to}
                assignedName={conversation.assigned_name}
                viewerId={user.id}
                team={team}
              />

              <FollowUpBox
                key={`fu:${conversation.follow_up_on}:${conversation.follow_up_note}`}
                id={conversation.id}
                date={conversation.follow_up_on}
                note={conversation.follow_up_note}
                closed={CLOSED_STATUSES.includes(conversation.status)}
              />

              <ContactDetails
                key={`cd:${conversation.status}`}
                id={conversation.id}
                source={conversation.source}
                status={conversation.status}
                values={contact}
                amount={conversation.amount}
                lostReason={conversation.lost_reason}
                origin={leadOrigin(conversation)}
                canDelete={isOwner}
              />

              {/* Colapsada por defecto: la tarjeta es salida de un modelo, así que
                  cualquier campo puede faltar y se renderiza solo lo que vino.
                  <details> nativo: sin estado en el cliente ni JS. Solo existe
                  para los chats: un contacto cargado a mano no tiene charla. */}
              {isChat ? (
                <details className="group bg-white rounded-2xl border border-brand-border">
                  <summary className="flex items-center gap-2 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <h2 className="text-sm font-semibold text-brand-dark">Resumen del asistente</h2>
                    <span className="text-[11px] text-brand-muted flex-1 truncate">
                      {card ? card.resumen : 'sin resumen todavía'}
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
                          <Block label="Próximo paso sugerido" value={card.proximo_paso} />
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-brand-muted">
                        Todavía no hay resumen. Se genera solo cuando la conversación lleva 20
                        minutos sin actividad.
                      </p>
                    )}

                    <p className="text-[11px] text-brand-muted mt-4 pt-3 border-t border-brand-border">
                      {formatDateTime(conversation.started_at)} · {leadOrigin(conversation)} ·{' '}
                      {conversation.page ?? '/'}
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
              ) : null}

              <PresupuestosBox conversationId={conversation.id} presupuestos={presupuestos} />

              <ActivityLog id={conversation.id} activities={activities} />

              {isChat ? (
                <section>
                  <h2 className="text-sm font-semibold text-brand-dark mb-2">
                    Conversación con el asistente ({messages.length} mensajes)
                  </h2>
                  <Thread messages={messages} />
                </section>
              ) : (
                <p className="text-[11px] text-brand-muted text-center">
                  {conversation.source === 'calculadora' ? 'Llegó por la web' : 'Cargado a mano'} el{' '}
                  {formatDateTime(conversation.started_at)} · {leadOrigin(conversation)}
                </p>
              )}
            </div>

            <footer className="flex-shrink-0 border-t border-brand-border bg-brand-cream px-3 sm:px-4 py-3">
              <ConversationActions
                id={conversation.id}
                sender={user.name.split(' ')[0]}
                phone={contact.telefono}
                nombre={contact.nombre}
                proyecto={contact.proyecto}
              />
            </footer>
          </>
        )}
      </section>

      <AutoRefresh />
    </div>
  )
}

function Stat({
  label,
  value,
  href,
  highlight = false,
}: {
  label: string
  value: number
  href?: string
  highlight?: boolean
}) {
  const className = `block rounded-xl border px-3 py-2 ${
    highlight ? 'bg-brand-gold/15 border-brand-gold/60' : 'bg-white border-brand-border'
  }`
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
