import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import ListaMovimientos from '@/components/admin/gestion/ListaMovimientos'
import MovimientoForm from '@/components/admin/gestion/MovimientoForm'
import { CLASE_ETIQUETA, Empty, Panel, Tile } from '@/components/admin/gestion/ui'
import AccionesCierre from '@/components/admin/obras/AccionesCierre'
import AjusteForm from '@/components/admin/obras/AjusteForm'
import EditarObraForm from '@/components/admin/obras/EditarObraForm'
import SelectorEtapa from '@/components/admin/obras/SelectorEtapa'
import { Atraso, diasDeAtraso, fechaTexto } from '@/components/admin/obras/piezas'
import { formatDateTime, formatMoney, todayKey } from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { listarMovimientos } from '@/lib/gestion/movimientos'
import {
  eventosDeObra,
  fichaObra,
  listarAjustes,
  listarVendedores,
  obraParaEquipo,
  type EventoObra,
} from '@/lib/gestion/obras'
import { opcionesMovimiento } from '@/lib/gestion/opciones'
import { obrasConResumen, type ObraConResumen } from '@/lib/gestion/reportes'
import { ETAPA_LABELS, type CuotaVigente, type EstadoCuota, type EtapaObra } from '@/lib/gestion/tipos'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Obra · Panel MCP' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ESTADO_CUOTA: Record<EstadoCuota, { texto: string; clase: string }> = {
  pagada: { texto: 'Pagada', clase: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  parcial: { texto: 'Parcial', clase: 'bg-amber-50 text-amber-800 border-amber-200' },
  exigible: { texto: 'Se puede reclamar', clase: 'bg-red-50 text-red-700 border-red-200' },
  futura: { texto: 'Más adelante', clase: 'bg-white text-brand-muted border-brand-border' },
}

interface DatosBase {
  id: string
  etapa: EtapaObra
  fecha_venta: string
  fecha_entrega: string | null
  entregada_en: string | null
  cancelada_en: string | null
}

function Dato({ label, ancho = false, children }: { label: string; ancho?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${ancho ? 'col-span-2' : ''}`}>
      <dt className={CLASE_ETIQUETA}>{label}</dt>
      <dd className="text-sm text-brand-dark break-words">{children}</dd>
    </div>
  )
}

function EstadoObra({ obra }: { obra: DatosBase }) {
  if (obra.entregada_en) {
    return <p className="text-sm text-emerald-800">Entregada el {fechaTexto(obra.entregada_en)}.</p>
  }
  if (obra.cancelada_en) {
    return <p className="text-sm text-red-700">Cancelada el {fechaTexto(obra.cancelada_en)}.</p>
  }
  return <SelectorEtapa obraId={obra.id} etapa={obra.etapa} />
}

function textoEvento(evento: EventoObra): string {
  if (evento.nota) {
    return evento.nota
  }
  return evento.etapa_anterior
    ? `${ETAPA_LABELS[evento.etapa_anterior]} → ${ETAPA_LABELS[evento.etapa]}`
    : ETAPA_LABELS[evento.etapa]
}

function EtapaEHistorial({ obra, eventos }: { obra: DatosBase; eventos: EventoObra[] }) {
  return (
    <Panel title="Etapa">
      <EstadoObra obra={obra} />
      {eventos.length > 0 ? (
        <ul className="mt-3 divide-y divide-brand-border/60">
          {eventos.map((evento) => (
            <li key={evento.id} className="py-1.5">
              <p className="text-sm text-brand-dark">{textoEvento(evento)}</p>
              <p className="text-[11px] text-brand-muted">
                {formatDateTime(evento.created_at)}
                {evento.autor ? ` · ${evento.autor}` : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  )
}

function FechasObra({ obra, hoy }: { obra: DatosBase; hoy: string }) {
  return (
    <>
      <Dato label="Venta">{fechaTexto(obra.fecha_venta)}</Dato>
      <Dato label="Entrega">
        <span className="mr-2">{fechaTexto(obra.fecha_entrega)}</span>
        <Atraso dias={diasDeAtraso(obra, hoy)} />
      </Dato>
    </>
  )
}

// ---------------------------------------------------------------- Empleados

// Solo columnas de COLUMNAS_EQUIPO: ni montos, ni comisión, ni teléfono del cliente.
async function VistaEquipo({ id }: { id: string }) {
  const [obra, eventos] = await Promise.all([obraParaEquipo(id), eventosDeObra(id)])
  if (!obra) {
    notFound()
  }

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title={`Obra N° ${obra.numero}`} subtitle={`${obra.cliente} · ${obra.titulo}`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Datos">
          <dl className="grid grid-cols-2 gap-3">
            <Dato label="Cliente">{obra.cliente}</Dato>
            <Dato label="Zona">{obra.zona ?? '—'}</Dato>
            <Dato label="Trabajo" ancho>
              {obra.titulo}
            </Dato>
            <FechasObra obra={obra} hoy={todayKey()} />
          </dl>
        </Panel>
        <EtapaEHistorial obra={obra} eventos={eventos} />
      </div>
    </main>
  )
}

// ---------------------------------------------------------------- Dueños

function FilaCuota({ cuota }: { cuota: CuotaVigente }) {
  const estado = ESTADO_CUOTA[cuota.estado]
  return (
    <li className="py-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-brand-dark min-w-0">{cuota.concepto}</p>
        <span className="text-sm font-semibold text-brand-dark tabular-nums flex-shrink-0">
          {formatMoney(cuota.vigente)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <p className="text-[11px] text-brand-muted min-w-0">
          {cuota.etapa_exigible ? `Desde ${ETAPA_LABELS[cuota.etapa_exigible]}` : 'Desde el inicio'}
          {cuota.estado === 'parcial' ? ` · falta ${formatMoney(cuota.saldo)}` : ''}
        </p>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>
    </li>
  )
}

function FilaCosto({ label, valor, fuerte = false }: { label: string; valor: number; fuerte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${fuerte ? 'pt-1.5 border-t border-brand-border' : ''}`}>
      <dt className={`text-sm min-w-0 ${fuerte ? 'font-semibold text-brand-dark' : 'text-brand-muted'}`}>{label}</dt>
      <dd className={`text-sm tabular-nums flex-shrink-0 text-brand-dark ${fuerte ? 'font-semibold' : ''}`}>
        {formatMoney(valor)}
      </dd>
    </div>
  )
}

function CostosYMargen({ obra }: { obra: ObraConResumen }) {
  const { resumen } = obra
  return (
    <Panel title="Costos y margen">
      <dl className="space-y-1.5">
        <FilaCosto label="Materiales" valor={obra.materiales} />
        <FilaCosto label="Gastos directos" valor={obra.gastos_directos} />
        <FilaCosto label={`Comisión (${obra.comision_pct} %)`} valor={resumen.comision} />
        <FilaCosto label="Costo total" valor={resumen.costo} fuerte />
        <FilaCosto label="Margen de la obra" valor={resumen.margen} fuerte />
      </dl>
      <p className="text-[11px] text-brand-muted mt-2">
        {resumen.cancelada
          ? 'Obra cancelada: el margen es lo cobrado menos lo gastado.'
          : 'El margen es el contrato menos los costos de esta obra. No es plata en caja y no se suma con la ganancia del mes.'}
      </p>
    </Panel>
  )
}

async function VistaDueno({ id }: { id: string }) {
  const [obras, ficha, eventos, ajustes, movimientos, opciones] = await Promise.all([
    obrasConResumen(),
    fichaObra(id),
    eventosDeObra(id),
    listarAjustes(id),
    listarMovimientos({ obraId: id, incluirAnulados: true }),
    opcionesMovimiento(),
  ])
  const obra = obras.find((candidata) => candidata.id === id)
  if (!obra || !ficha) {
    notFound()
  }
  const vendedores = await listarVendedores(obra.vendedor_id)

  const { resumen } = obra
  const abierta = !resumen.entregada && !resumen.cancelada
  const hoy = todayKey()

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title={`Obra N° ${obra.numero}`} subtitle={`${obra.cliente} · ${obra.titulo}`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4 min-w-0">
          <Panel title="Saldo">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Tile label="Contrato vigente" value={formatMoney(resumen.totalVigente)} />
              <Tile label="Cobrado" value={formatMoney(resumen.cobradoNeto)} />
              <Tile label="Pendiente" value={formatMoney(resumen.pendiente)} />
              <Tile
                label="Se puede reclamar"
                value={formatMoney(obra.exigible)}
                tono={obra.exigible > 0 ? 'alerta' : 'normal'}
              />
              <Tile label="Saldo a favor" value={formatMoney(resumen.saldoAFavor)} />
            </div>
            {obra.cobrado_inicial > 0 ? (
              <p className="text-[11px] text-brand-muted mt-2">
                El cobrado incluye {formatMoney(obra.cobrado_inicial)} de antes de usar el panel.
              </p>
            ) : null}
          </Panel>

          <EtapaEHistorial obra={obra} eventos={eventos} />

          {resumen.cancelada ? null : (
            <Panel title="Registrar cobro">
              <MovimientoForm
                opciones={opciones}
                claveFija="cobro_obra"
                preset={{ obraId: obra.id }}
                bloquear={['obraId']}
                textoBoton="Registrar cobro"
              />
            </Panel>
          )}

          <details className="bg-white rounded-2xl border border-brand-border p-4 min-w-0" open={resumen.cancelada}>
            <summary className="text-sm font-semibold text-brand-dark">Devolverle plata al cliente</summary>
            <div className="mt-3">
              <MovimientoForm
                opciones={opciones}
                claveFija="devolucion_cliente"
                preset={{ obraId: obra.id }}
                bloquear={['obraId']}
                textoBoton="Registrar devolución"
              />
            </div>
          </details>

          <Panel title="Movimientos de esta obra">
            <ListaMovimientos movimientos={movimientos} vacio="Todavía no se registró ningún cobro." />
          </Panel>
        </div>

        <div className="space-y-4 min-w-0">
          <Panel title="Datos">
            <dl className="grid grid-cols-2 gap-3">
              <Dato label="Cliente">{obra.cliente}</Dato>
              <Dato label="Teléfono">
                {ficha.telefono ? (
                  <a href={`tel:${ficha.telefono}`} className="underline underline-offset-2">
                    {ficha.telefono}
                  </a>
                ) : (
                  '—'
                )}
              </Dato>
              <Dato label="Trabajo" ancho>
                {obra.titulo}
              </Dato>
              <Dato label="Zona">{ficha.zona ?? '—'}</Dato>
              <Dato label="Vendedor">{obra.vendedor_nombre ?? 'Sin vendedor'}</Dato>
              <FechasObra obra={obra} hoy={hoy} />
              {ficha.notas ? (
                <Dato label="Notas" ancho>
                  <span className="whitespace-pre-wrap">{ficha.notas}</span>
                </Dato>
              ) : null}
            </dl>
            {ficha.conversation_id || ficha.presupuesto_id ? (
              <div className="flex flex-wrap gap-3 mt-3">
                {ficha.conversation_id ? (
                  <Link
                    href={`/admin?c=${ficha.conversation_id}`}
                    className="text-xs font-semibold text-brand-dark underline underline-offset-2"
                  >
                    Ver contacto
                  </Link>
                ) : null}
                {ficha.presupuesto_id ? (
                  <Link
                    href={`/admin/presupuesto/${ficha.presupuesto_id}`}
                    className="text-xs font-semibold text-brand-dark underline underline-offset-2"
                  >
                    Presupuesto N° {ficha.presupuesto_numero}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </Panel>

          <Panel title="Cuotas">
            {resumen.cancelada ? (
              <Empty>La obra está cancelada: las cuotas ya no corren.</Empty>
            ) : obra.cuotas.length === 0 ? (
              <Empty>
                Esta obra no tiene plan de cuotas porque no salió de un presupuesto. Lo que falte se puede
                reclamar cuando se entregue.
              </Empty>
            ) : (
              <ul className="divide-y divide-brand-border/60">
                {obra.cuotas.map((cuota) => (
                  <FilaCuota key={cuota.orden} cuota={cuota} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Adicionales y descuentos">
            {ajustes.length === 0 ? (
              <Empty>Si cambia lo acordado con el cliente, cargalo acá. El contrato original no se toca.</Empty>
            ) : (
              <ul className="divide-y divide-brand-border/60">
                {ajustes.map((ajuste) => (
                  <li key={ajuste.id} className="py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-brand-dark break-words">{ajuste.motivo}</p>
                      <p className="text-[11px] text-brand-muted">
                        {fechaTexto(ajuste.fecha)}
                        {ajuste.autor ? ` · ${ajuste.autor}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-brand-dark flex-shrink-0">
                      {ajuste.monto > 0 ? '+' : '−'} {formatMoney(Math.abs(ajuste.monto))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {resumen.cancelada ? null : (
              <div className="mt-3 pt-3 border-t border-brand-border">
                <AjusteForm obraId={obra.id} />
              </div>
            )}
          </Panel>

          <CostosYMargen obra={obra} />

          <Panel title="Editar datos">
            <EditarObraForm
              obraId={obra.id}
              fechaEntregaInicial={obra.fecha_entrega}
              notasIniciales={ficha.notas}
              vendedorIdInicial={obra.vendedor_id}
              comisionInicial={obra.comision_pct}
              vendedores={vendedores}
            />
          </Panel>

          {abierta ? (
            <Panel title="Cerrar la obra">
              <AccionesCierre obraId={obra.id} pendiente={resumen.pendiente} cobrado={resumen.cobradoNeto} />
            </Panel>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default async function ObraPage({ params }: { params: { id: string } }) {
  const user = await requireAdminPage()
  if (!UUID_RE.test(params.id)) {
    notFound()
  }
  return user.role === 'owner' ? <VistaDueno id={params.id} /> : <VistaEquipo id={params.id} />
}
