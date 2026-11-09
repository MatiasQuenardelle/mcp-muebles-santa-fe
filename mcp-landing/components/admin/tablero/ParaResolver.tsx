import Link from 'next/link'
import { Empty, Panel } from '@/components/admin/gestion/ui'
import { followUpLabel, formatMoney, todayKey } from '@/lib/adminFormat'
import { ETAPA_LABELS, type Reportes } from '@/lib/gestion/tipos'

// En el celular, muchas obras o seguimientos no pueden tapar el resto de la lista.
const MAXIMO_POR_TIPO = 3

export interface Accion {
  key: string
  href: string
  titulo: string
  detalle: string | null
}

const contar = (cantidad: number, singular: string, plural: string) =>
  `${cantidad} ${cantidad === 1 ? singular : plural}`

export function accionesParaResolver({
  atrasadas,
  cobranzas,
  deudaProveedores,
  pendientes,
  seguimientos,
}: Pick<Reportes, 'atrasadas' | 'cobranzas' | 'deudaProveedores' | 'pendientes' | 'seguimientos'>): Accion[] {
  const acciones: Accion[] = []
  const hoy = todayKey()

  for (const obra of atrasadas.obras.slice(0, MAXIMO_POR_TIPO)) {
    acciones.push({
      key: `obra-${obra.id}`,
      href: `/admin/obras/${obra.id}`,
      titulo: `Obra atrasada: ${obra.cliente}`,
      detalle: `${obra.titulo} · ${contar(obra.diasAtraso, 'día', 'días')} de atraso · en ${ETAPA_LABELS[obra.etapa]}`,
    })
  }
  if (atrasadas.cantidad > MAXIMO_POR_TIPO) {
    acciones.push({
      key: 'obras-mas',
      href: '/admin/obras',
      titulo: `${contar(atrasadas.cantidad - MAXIMO_POR_TIPO, 'obra atrasada', 'obras atrasadas')} más`,
      detalle: null,
    })
  }

  if (pendientes.ventasSinObra > 0) {
    acciones.push({
      key: 'ventas-sin-obra',
      // /admin no tiene filtro de ganados: la columna Ganado del embudo es lo que los aísla.
      href: '/admin/embudo',
      titulo: `${contar(pendientes.ventasSinObra, 'venta', 'ventas')} sin obra cargada`,
      detalle: 'Creá la obra para seguir el trabajo y los cobros',
    })
  }

  if (pendientes.cuotasExigibles > 0) {
    acciones.push({
      key: 'reclamable',
      href: '/admin/obras/cobros',
      titulo: `Reclamar ${formatMoney(cobranzas.exigibleAhora)} a clientes`,
      detalle: `${contar(pendientes.cuotasExigibles, 'obra', 'obras')} con cuotas para cobrar`,
    })
  }

  if (pendientes.comprasVencidas > 0) {
    acciones.push({
      key: 'compras-vencidas',
      href: '/admin/compras/proveedores',
      titulo: `Pagar ${formatMoney(deudaProveedores.vencido)} a proveedores`,
      detalle: contar(pendientes.comprasVencidas, 'compra vencida', 'compras vencidas'),
    })
  }

  // items también trae los de hoy y los presupuestos sin fecha: acá van solo los vencidos.
  const vencidos = seguimientos.items.filter((item) => item.fecha !== null && item.fecha < hoy)
  for (const item of vencidos.slice(0, MAXIMO_POR_TIPO)) {
    acciones.push({
      key: `seguimiento-${item.conversationId}`,
      href: `/admin?c=${item.conversationId}`,
      titulo: `Seguimiento vencido: ${item.nombre}`,
      detalle: [followUpLabel(item.fecha as string).label, item.nota].filter(Boolean).join(' · '),
    })
  }
  if (seguimientos.vencidos > MAXIMO_POR_TIPO) {
    acciones.push({
      key: 'seguimientos-mas',
      href: '/admin?f=seguimiento',
      titulo: `${contar(seguimientos.vencidos - MAXIMO_POR_TIPO, 'seguimiento vencido', 'seguimientos vencidos')} más`,
      detalle: null,
    })
  }

  if (pendientes.tareasVencidas > 0) {
    acciones.push({
      key: 'tareas',
      href: '/admin/equipo/tareas',
      titulo: contar(pendientes.tareasVencidas, 'tarea vencida', 'tareas vencidas'),
      detalle: null,
    })
  }

  if (pendientes.fijosSinGenerar > 0) {
    acciones.push({
      key: 'fijos',
      href: '/admin/caja/fijos',
      titulo: `${contar(pendientes.fijosSinGenerar, 'gasto fijo', 'gastos fijos')} sin cargar`,
      detalle: 'Del período actual',
    })
  }

  return acciones
}

export function ParaResolver({ acciones }: { acciones: Accion[] }) {
  return (
    <Panel title="Para resolver">
      {acciones.length === 0 ? (
        <Empty>Nada para resolver: está todo al día.</Empty>
      ) : (
        <ul className="divide-y divide-brand-border/60">
          {acciones.map((accion) => (
            <li key={accion.key}>
              <Link href={accion.href} className="flex items-center gap-3 py-2.5 min-h-[44px]">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-brand-dark break-words">{accion.titulo}</div>
                  {accion.detalle ? <div className="text-xs text-brand-muted truncate">{accion.detalle}</div> : null}
                </div>
                <span aria-hidden className="text-brand-muted flex-shrink-0">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
