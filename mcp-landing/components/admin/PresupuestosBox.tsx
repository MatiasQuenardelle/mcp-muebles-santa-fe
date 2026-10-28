import Link from 'next/link'
import { formatDateTime, formatMoney } from '@/lib/adminFormat'
import type { PresupuestoRow } from '@/lib/db'

// Presupuestos del contacto, en su ficha. El formal se edita en su propia
// pantalla (el formulario no entra en el panel lateral); el preliminar es el que
// se bajó el visitante en la calculadora y solo se mira.
export default function PresupuestosBox({
  conversationId,
  presupuestos,
}: {
  conversationId: string
  presupuestos: PresupuestoRow[]
}) {
  return (
    <section className="bg-white rounded-2xl border border-brand-border p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-sm font-semibold text-brand-dark">Presupuestos</h2>
        <Link
          href={`/admin/presupuesto/nuevo?c=${conversationId}`}
          className="rounded-full bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-1.5"
        >
          + Nuevo presupuesto
        </Link>
      </div>

      {presupuestos.length === 0 ? (
        <p className="text-sm text-brand-muted">
          Todavía no tiene. Armalo acá y descargá el PDF para mandárselo por WhatsApp.
        </p>
      ) : (
        <ul className="divide-y divide-brand-border">
          {presupuestos.map((p) => (
            <li key={p.id} className="py-2.5 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-brand-dark">
                  <span className="font-semibold">N° {p.numero}</span> · {formatMoney(p.total)}
                </p>
                <p className="text-[11px] text-brand-muted">
                  {p.kind === 'preliminar'
                    ? 'Preliminar de la calculadora'
                    : p.sent_at
                      ? `Enviado ${formatDateTime(p.sent_at)}`
                      : `Borrador · ${formatDateTime(p.updated_at)}`}
                </p>
              </div>
              {p.kind === 'formal' ? (
                <Link
                  href={`/admin/presupuesto/${p.id}`}
                  className="text-xs font-semibold text-brand-dark underline underline-offset-2"
                >
                  Editar
                </Link>
              ) : null}
              <a
                href={`/api/admin/presupuestos/${p.id}/pdf`}
                className="text-xs font-semibold text-brand-dark underline underline-offset-2"
              >
                PDF
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
