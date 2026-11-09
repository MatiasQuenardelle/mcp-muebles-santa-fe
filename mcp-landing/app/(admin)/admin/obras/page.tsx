import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import {
  CLASE_BOTON_PILL,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
  Empty,
  Panel,
} from '@/components/admin/gestion/ui'
import SelectorEtapa from '@/components/admin/obras/SelectorEtapa'
import { Atraso, diasDeAtraso, fechaTexto } from '@/components/admin/obras/piezas'
import { todayKey } from '@/lib/adminFormat'
import { requireAdminPage } from '@/lib/adminSession'
import { listarObras, type ObraEquipo, type VistaObras } from '@/lib/gestion/obras'
import { ETAPAS_OBRA, ETAPA_LABELS } from '@/lib/gestion/tipos'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Obras · Panel MCP' }

const VISTAS: Record<VistaObras, string> = {
  en_curso: 'En curso',
  entregadas: 'Entregadas',
  canceladas: 'Canceladas',
}

function esVista(valor: string | undefined): valor is VistaObras {
  // hasOwn y no `in`: ?ver=constructor no puede llegar a armar el SQL.
  return valor !== undefined && Object.hasOwn(VISTAS, valor)
}

function TarjetaObra({ obra, hoy }: { obra: ObraEquipo; hoy: string }) {
  const atraso = diasDeAtraso(obra, hoy)
  const abierta = obra.entregada_en === null && obra.cancelada_en === null
  const pie = obra.entregada_en
    ? `Entregada ${fechaTexto(obra.entregada_en)}`
    : obra.cancelada_en
      ? `Cancelada ${fechaTexto(obra.cancelada_en)}`
      : `Entrega ${fechaTexto(obra.fecha_entrega, 'sin fecha')}`

  return (
    <li
      className={`rounded-xl border p-3 space-y-2 min-w-0 ${
        atraso > 0 ? 'border-red-300 bg-red-50' : 'border-brand-border bg-brand-cream'
      }`}
    >
      {/* El select queda afuera del link: tocarlo no tiene que abrir la ficha. */}
      <Link href={`/admin/obras/${obra.id}`} className="block min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-brand-dark truncate">{obra.titulo}</p>
          <span className="text-[11px] text-brand-muted tabular-nums flex-shrink-0">{obra.numero}</span>
        </div>
        <p className="text-xs text-brand-muted truncate">
          {obra.cliente}
          {obra.zona ? ` · ${obra.zona}` : ''}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <p className="text-xs text-brand-dark">{pie}</p>
          <Atraso dias={atraso} />
        </div>
      </Link>
      {abierta ? <SelectorEtapa obraId={obra.id} etapa={obra.etapa} /> : null}
    </li>
  )
}

export default async function ObrasPage({ searchParams }: { searchParams: { ver?: string } }) {
  const user = await requireAdminPage()
  const esDueno = user.role === 'owner'
  const vista: VistaObras = esVista(searchParams.ver) ? searchParams.ver : 'en_curso'
  const obras = await listarObras(vista)
  const hoy = todayKey()

  const atrasadas = obras.filter((obra) => diasDeAtraso(obra, hoy) > 0).length
  const subtitulo =
    vista === 'en_curso'
      ? `${obras.length} en curso${atrasadas > 0 ? ` · ${atrasadas} atrasadas` : ''}`
      : `${obras.length} ${VISTAS[vista].toLowerCase()}`

  const porEtapa = ETAPAS_OBRA.map((etapa) => ({
    etapa,
    lista: obras.filter((obra) => obra.etapa === etapa),
  })).filter((grupo) => grupo.lista.length > 0)

  return (
    <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <AdminHeader title="Obras" subtitle={subtitulo} />

      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <nav className="flex gap-1.5 flex-wrap">
          {(Object.keys(VISTAS) as VistaObras[]).map((clave) => (
            <Link
              key={clave}
              href={clave === 'en_curso' ? '/admin/obras' : `/admin/obras?ver=${clave}`}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                clave === vista ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
              }`}
            >
              {VISTAS[clave]}
            </Link>
          ))}
        </nav>
        {esDueno ? (
          <Link href="/admin/obras/nueva" className={CLASE_BOTON_PILL}>
            + Nueva obra
          </Link>
        ) : null}
      </div>

      {obras.length === 0 ? (
        <Panel title={vista === 'en_curso' ? 'Todavía no hay obras en curso' : `No hay obras ${VISTAS[vista].toLowerCase()}`}>
          <Empty>
            {vista !== 'en_curso'
              ? 'Cuando una obra se cierre va a quedar guardada acá.'
              : esDueno
                ? 'Una obra nace de un contacto marcado como Ganado: abrilo y creala desde su ficha. Si ya tenés trabajos en marcha, empezá cargándolos con “Nueva obra”.'
                : 'Cuando se cargue una obra va a aparecer acá, separada por etapa.'}
          </Empty>
        </Panel>
      ) : vista === 'en_curso' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {porEtapa.map(({ etapa, lista }) => (
            <Panel key={etapa} title={`${ETAPA_LABELS[etapa]} (${lista.length})`}>
              <ul className="space-y-2">
                {lista.map((obra) => (
                  <TarjetaObra key={obra.id} obra={obra} hoy={hoy} />
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {obras.map((obra) => (
            <TarjetaObra key={obra.id} obra={obra} hoy={hoy} />
          ))}
        </ul>
      )}
    </main>
  )
}
