import Link from 'next/link'
import { notFound } from 'next/navigation'
import ConversationActions from '@/components/admin/ConversationActions'
import RegenerateCardButton from '@/components/admin/RegenerateCardButton'
import {
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
  formatDateTime,
  formatRelative,
  originLabel,
} from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { getConversation, getMessages, isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Consulta · Panel MCP' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ConversationPage({ params }: { params: { id: string } }) {
  await requireAdminPage()

  if (!isDatabaseConfigured() || !UUID_RE.test(params.id)) {
    notFound()
  }

  const conversation = await getConversation(params.id)
  if (!conversation) {
    notFound()
  }

  const messages = await getMessages(params.id)
  const card = conversation.card
  const nombre = card?.nombre ?? conversation.name
  const telefono = card?.telefono ?? conversation.phone

  return (
    <main className="px-4 py-6 sm:px-6 max-w-2xl mx-auto">
      <Link href="/admin" className="text-sm text-brand-muted inline-flex items-center gap-1.5 mb-4">
        <span aria-hidden>←</span> Volver
      </Link>

      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-serif text-2xl text-brand-dark leading-tight">
            {nombre ?? 'Consulta sin nombre'}
          </h1>
          {card?.temperatura ? (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-1.5 ${
                TEMPERATURE_STYLES[card.temperatura] ?? ''
              }`}
            >
              {TEMPERATURE_LABELS[card.temperatura] ?? card.temperatura}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-brand-muted mt-1">
          {formatDateTime(conversation.started_at)} · {originLabel(conversation.attribution)} ·{' '}
          {conversation.page ?? '/'}
        </p>
      </header>

      <ConversationActions
        id={conversation.id}
        status={conversation.status}
        notes={conversation.notes ?? ''}
        phone={telefono}
        nombre={nombre}
        proyecto={card?.tipo_proyecto ?? null}
      />

      {/* Tarjeta de contacto. Es salida de un modelo: cualquier campo puede
          faltar, así que se renderiza solo lo que vino. */}
      <section className="bg-white rounded-2xl border border-brand-border p-4 mt-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-brand-dark">Tarjeta de contacto</h2>
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
            {card.proximo_paso ? <Block label="Próximo paso" value={card.proximo_paso} /> : null}

            {conversation.card_generated_at ? (
              <p className="text-[11px] text-brand-muted mt-4">
                Resumen generado {formatRelative(conversation.card_generated_at)}
                {conversation.card_message_count !== null &&
                conversation.card_message_count < conversation.message_count
                  ? ' · la charla siguió después'
                  : ''}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-brand-muted">
            Todavía no hay resumen. Se genera solo cuando la conversación lleva 20 minutos sin
            actividad.
          </p>
        )}
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-semibold text-brand-dark mb-3">
          Conversación completa ({messages.length} mensajes)
        </h2>
        <div className="space-y-2.5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'ml-auto bg-brand-dark text-white rounded-br-sm'
                  : 'mr-auto bg-white border border-brand-border text-brand-dark rounded-bl-sm'
              }`}
            >
              {message.content}
            </div>
          ))}
          {messages.length === 0 ? (
            <p className="text-sm text-brand-muted">No hay mensajes guardados.</p>
          ) : null}
        </div>
      </section>
    </main>
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
