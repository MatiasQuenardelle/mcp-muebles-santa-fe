import Link from 'next/link'
import { Panel } from '@/components/admin/gestion/ui'
import { formatDateTime } from '@/lib/adminFormat'
import type { ConversationRow, PresupuestoRow } from '@/lib/db'
import { listarVendedores, obrasDelContacto, type ObraDeUnContacto } from '@/lib/gestion/obras'
import { ETAPA_LABELS } from '@/lib/gestion/tipos'
import type { AdminUser } from '@/lib/session'
import CrearObraContactoForm, { type PresupuestoOpcion } from './CrearObraContactoForm'
import { fechaTexto } from './piezas'

function estadoDeObra(obra: ObraDeUnContacto): string {
  if (obra.cancelada_en) {
    return `Cancelada el ${fechaTexto(obra.cancelada_en)}`
  }
  if (obra.entregada_en) {
    return `Entregada el ${fechaTexto(obra.entregada_en)}`
  }
  return `${ETAPA_LABELS[obra.etapa]} · entrega ${fechaTexto(obra.fecha_entrega, 'sin fecha')}`
}

// Enviados primero, del más reciente al más viejo; `presupuestos` ya viene por fecha
// de creación y el sort es estable. sent_at llega como Date aunque el tipo diga string.
function opcionesDePresupuesto(presupuestos: PresupuestoRow[], usados: Set<string>): PresupuestoOpcion[] {
  const envio = (presupuesto: PresupuestoRow) =>
    presupuesto.sent_at ? new Date(presupuesto.sent_at).getTime() : 0
  return presupuestos
    .filter((p) => p.kind === 'formal' && p.total > 0 && !usados.has(p.id))
    .sort((a, b) => envio(b) - envio(a))
    .map((p) => ({
      id: p.id,
      numero: p.numero,
      total: p.total,
      detalle: p.sent_at ? `Enviado ${formatDateTime(p.sent_at)}` : 'Sin enviar',
    }))
}

// La obra del contacto, o el formulario para crearla si ya está ganado.
export default async function ObraDeContacto({
  conversation,
  presupuestos,
  viewer,
}: {
  conversation: ConversationRow
  presupuestos: PresupuestoRow[]
  viewer: AdminUser
}) {
  const obras = await obrasDelContacto(conversation.id)
  const puedeCrear =
    conversation.status === 'ganado' &&
    !obras.some((obra) => obra.cancelada_en === null) &&
    !conversation.is_demo &&
    viewer.role === 'owner'

  if (obras.length === 0 && !puedeCrear) {
    return null
  }

  // Un presupuesto se vende una sola vez, salvo que esa venta se haya caído.
  const usados = new Set(
    obras.flatMap((obra) => (obra.presupuesto_id && obra.cancelada_en === null ? [obra.presupuesto_id] : []))
  )
  const opciones = puedeCrear ? opcionesDePresupuesto(presupuestos, usados) : []
  const vendedores = puedeCrear ? await listarVendedores() : []

  return (
    <Panel title={puedeCrear ? 'Crear la obra de esta venta' : 'Obra'}>
      {obras.length > 0 ? (
        <ul className={`divide-y divide-brand-border/60 ${puedeCrear ? 'mb-3' : ''}`}>
          {obras.map((obra) => (
            <li key={obra.id}>
              <Link href={`/admin/obras/${obra.id}`} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-brand-dark truncate">
                    N° {obra.numero} · {obra.titulo}
                  </span>
                  <span className="block text-xs text-brand-muted truncate">{estadoDeObra(obra)}</span>
                </span>
                <span className="text-xs font-semibold text-brand-dark underline underline-offset-2 flex-shrink-0">
                  Ver obra
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {puedeCrear ? (
        <CrearObraContactoForm
          conversationId={conversation.id}
          presupuestos={opciones}
          vendedores={vendedores}
        />
      ) : null}
    </Panel>
  )
}
