import AdminTabs from '@/components/admin/AdminTabs'
import LogoutButton from '@/components/admin/LogoutButton'
import { formatDateTime, formatRelative, originLabel } from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { isDatabaseConfigured, listWhatsAppClicks } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'WhatsApp · Panel MCP' }

export default async function WhatsAppPage() {
  await requireAdminPage()

  const clicks = isDatabaseConfigured() ? await listWhatsAppClicks() : []

  return (
    <main className="px-4 py-6 sm:px-6 max-w-3xl mx-auto">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-dark leading-tight">Clics a WhatsApp</h1>
          <p className="text-sm text-brand-muted">
            Quién tocó un botón de WhatsApp en la web y de dónde venía
          </p>
        </div>
        <LogoutButton />
      </header>

      <AdminTabs />

      {clicks.length === 0 ? (
        <p className="text-sm text-brand-muted text-center py-12">
          Todavía no hubo clics a WhatsApp.
        </p>
      ) : (
        <>
          <p className="text-xs text-brand-muted mb-3">
            Estas personas te escribieron directo por WhatsApp, sin pasar por el chat de la web. No
            queda su número acá: cruzá la hora con el mensaje que te llegó para saber de dónde vino.
          </p>
          <ul className="space-y-2">
            {clicks.map((click) => (
              <li
                key={click.id}
                className="bg-white rounded-2xl border border-brand-border px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-brand-dark truncate">
                    {originLabel(click.attribution)}
                  </span>
                  <span className="text-[11px] text-brand-muted flex-shrink-0 tabular-nums">
                    {formatRelative(click.created_at)}
                  </span>
                </div>
                <div className="text-[11px] text-brand-muted mt-1 flex flex-wrap gap-x-2">
                  <span className="tabular-nums">{formatDateTime(click.created_at)}</span>
                  <span aria-hidden>·</span>
                  <span className="truncate">{click.page ?? '/'}</span>
                  <span aria-hidden>·</span>
                  <span>{placementLabel(click.source)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

// El source se guarda como `whatsapp:<placement>` en lib/useWhatsAppCTA.ts.
function placementLabel(source: string): string {
  return source.split(':')[1] ?? source
}
