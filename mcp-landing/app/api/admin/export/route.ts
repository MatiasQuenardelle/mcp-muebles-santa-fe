import { NextResponse } from 'next/server'
import { STATUS_LABELS, contactView, formatDateTime, leadOrigin } from '@/lib/adminFormat'
import { requireAdmin } from '@/lib/auth'
import { listAllConversations } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Planilla con todos los contactos, para abrir en Excel / Google Sheets o
// rendir cuentas de dónde salió cada venta.
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const rows = await listAllConversations()

  const header = [
    'Fecha de ingreso',
    'Nombre',
    'Teléfono',
    'Email',
    'Zona',
    'Proyecto',
    'Origen',
    'Campaña',
    'Estado',
    'Monto',
    'Próximo seguimiento',
    'Motivo de pérdida',
    'Temperatura',
    'Resumen del asistente',
    'Mensajes del chat',
  ]

  const lines = rows.map((row) => {
    const contact = contactView(row)
    const campaign = row.attribution?.campaign
    return [
      formatDateTime(row.started_at),
      contact.nombre,
      contact.telefono,
      contact.email,
      contact.zona,
      contact.proyecto,
      leadOrigin(row),
      typeof campaign === 'string' ? campaign : '',
      STATUS_LABELS[row.status] ?? row.status,
      row.amount ?? '',
      row.follow_up_on ?? '',
      row.lost_reason,
      row.card?.temperatura ?? '',
      row.card?.resumen ?? '',
      row.message_count,
    ]
  })

  // Punto y coma: es el separador que espera el Excel en castellano. El BOM hace
  // que abra los acentos bien.
  const csv =
    '﻿' + [header, ...lines].map((line) => line.map(csvCell).join(';')).join('\r\n')

  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contactos-mcp-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  let text = String(value)
  // Evita que Excel interprete un "=..." de un visitante como fórmula. Un "+54..."
  // es un teléfono, no una fórmula: se deja pasar si sigue un dígito.
  if (/^[=@]|^[+-](?![\d\s(])/.test(text)) {
    text = `'${text}`
  }
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
