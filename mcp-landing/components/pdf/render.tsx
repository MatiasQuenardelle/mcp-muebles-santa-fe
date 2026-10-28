// Server-only: arma el PDF de un presupuesto guardado y lo devuelve como
// respuesta HTTP. Lo comparten la ruta del panel y la pública.

import { renderToBuffer } from '@react-pdf/renderer'
import type { PresupuestoRow } from '@/lib/db'
import type { PreliminarData, PresupuestoData } from '@/lib/presupuesto'
import { PropuestaFormalPdf, PropuestaPreliminarPdf } from './PropuestaPdf'

export async function presupuestoPdfResponse(
  row: PresupuestoRow,
  disposition: 'attachment' | 'inline'
): Promise<Response> {
  const pdf = await renderToBuffer(
    row.kind === 'formal' ? (
      <PropuestaFormalPdf numero={row.numero} data={row.data as PresupuestoData} />
    ) : (
      <PropuestaPreliminarPdf numero={row.numero} data={row.data as PreliminarData} />
    )
  )
  const nombre = `Presupuesto MCP Muebles ${row.numero} - ${row.data.cliente}.pdf`
  // filename* lleva el nombre con tildes; filename, una versión ASCII para los
  // navegadores viejos.
  const ascii = nombre.normalize('NFD').replace(/[^\x20-\x7e]/g, '').replace(/"/g, '')
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      'Cache-Control': 'private, no-store',
    },
  })
}
