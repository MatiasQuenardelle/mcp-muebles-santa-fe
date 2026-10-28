'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Input } from '@/components/admin/ContactDetails'
import { formatMoney } from '@/lib/adminFormat'
import {
  createPresupuestoRequest,
  deletePresupuestoRequest,
  patchPresupuesto,
} from '@/lib/adminApi'
import {
  SECCIONES,
  calcular,
  subtotalItem,
  type PresupuestoData,
  type SeccionId,
} from '@/lib/presupuesto'

// Los números se editan como texto para poder tipearlos a la argentina:
// "1.300.000" en precios y "2,5" en cantidades.
interface FilaForm {
  concepto: string
  cantidad: string
  precio: string
}

type Form = Omit<PresupuestoData, 'secciones' | 'validezDias'> & {
  validezDias: string
  secciones: Record<SeccionId, FilaForm[]>
}

function aTexto(n: number): string {
  return n === 0 ? '' : String(n).replace('.', ',')
}

// Precio: los puntos son miles y la coma, decimales.
function precioNum(value: string): number {
  const n = Number(value.replace(/[^\d,]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

// Cantidad: punto o coma valen como decimal ("2.5" y "2,5" son lo mismo).
function cantidadNum(value: string): number {
  const n = Number(value.replace(/[^\d,.]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function desdeData(data: PresupuestoData): Form {
  const secciones = {} as Form['secciones']
  for (const { id } of SECCIONES) {
    secciones[id] = (data.secciones.find((s) => s.id === id)?.items ?? []).map((item) => ({
      concepto: item.concepto,
      cantidad: aTexto(item.cantidad),
      precio: item.precio === 0 ? '' : String(item.precio),
    }))
  }
  return { ...data, validezDias: String(data.validezDias), secciones }
}

function aData(form: Form): PresupuestoData {
  return {
    ...form,
    validezDias: Math.round(cantidadNum(form.validezDias)),
    secciones: SECCIONES.map(({ id }) => ({
      id,
      items: form.secciones[id].map((fila) => ({
        concepto: fila.concepto,
        cantidad: cantidadNum(fila.cantidad),
        precio: precioNum(fila.precio),
      })),
    })),
  }
}

export default function PresupuestoEditor({
  conversationId,
  presupuesto,
  initial,
}: {
  conversationId: string
  // null = todavía no se guardó
  presupuesto: { id: string; numero: string; sentAt: string | null } | null
  initial: PresupuestoData
}) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(() => desdeData(initial))
  const [dirty, setDirty] = useState(presupuesto === null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'' | 'guardar' | 'enviado' | 'borrar'>('')

  const data = useMemo(() => aData(form), [form])
  const calc = useMemo(() => calcular(data), [data])

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
    setDirty(true)
  }

  function setFila(seccion: SeccionId, index: number, key: keyof FilaForm, value: string) {
    setForm((previous) => ({
      ...previous,
      secciones: {
        ...previous.secciones,
        [seccion]: previous.secciones[seccion].map((fila, i) =>
          i === index ? { ...fila, [key]: value } : fila
        ),
      },
    }))
    setDirty(true)
  }

  function agregarFila(seccion: SeccionId) {
    set('secciones', {
      ...form.secciones,
      [seccion]: [...form.secciones[seccion], { concepto: '', cantidad: '', precio: '' }],
    })
  }

  function quitarFila(seccion: SeccionId, index: number) {
    set('secciones', {
      ...form.secciones,
      [seccion]: form.secciones[seccion].filter((_, i) => i !== index),
    })
  }

  async function guardar() {
    setBusy('guardar')
    setError('')
    if (presupuesto) {
      const failure = await patchPresupuesto(presupuesto.id, { data })
      setBusy('')
      if (failure) {
        setError(failure)
        return
      }
      setDirty(false)
      router.refresh()
      return
    }
    const result = await createPresupuestoRequest(conversationId, data)
    setBusy('')
    if ('error' in result) {
      setError(result.error)
      return
    }
    router.replace(`/admin/presupuesto/${result.id}`)
    router.refresh()
  }

  async function marcarEnviado() {
    if (!presupuesto) {
      return
    }
    setBusy('enviado')
    setError('')
    const failure = await patchPresupuesto(presupuesto.id, { marcarEnviado: true })
    setBusy('')
    if (failure) {
      setError(failure)
      return
    }
    router.refresh()
  }

  async function borrar() {
    if (!presupuesto || !window.confirm(`¿Borrar el presupuesto N° ${presupuesto.numero}?`)) {
      return
    }
    setBusy('borrar')
    const failure = await deletePresupuestoRequest(presupuesto.id)
    setBusy('')
    if (failure) {
      setError(failure)
      return
    }
    router.replace(`/admin?c=${conversationId}`)
    router.refresh()
  }

  return (
    // pb-40: deja lugar para la barra fija de abajo.
    <div className="space-y-4 pb-40">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/admin?c=${conversationId}`}
          className="text-xs font-semibold text-brand-dark underline underline-offset-2"
        >
          ← Volver al contacto
        </Link>
        {presupuesto?.sentAt ? (
          <span className="text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1">
            Enviado
          </span>
        ) : null}
      </div>

      <section className="bg-white rounded-2xl border border-brand-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Cliente *" value={form.cliente} onChange={(v) => set('cliente', v)} required />
        <Input label="Localidad" value={form.localidad} onChange={(v) => set('localidad', v)} />
        <div className="sm:col-span-2">
          <Input
            label="Proyecto"
            value={form.proyecto}
            onChange={(v) => set('proyecto', v)}
            placeholder="Cocina 4,60 m de pared a pared"
          />
        </div>
        <Input label="Fecha" type="date" value={form.fecha} onChange={(v) => set('fecha', v)} />
        <Input
          label="Validez (días)"
          inputMode="numeric"
          value={form.validezDias}
          onChange={(v) => set('validezDias', v)}
        />
        <Input label="Término de entrega" value={form.entrega} onChange={(v) => set('entrega', v)} />
        <Input
          label="Garantía en herrajes"
          value={form.garantia}
          onChange={(v) => set('garantia', v)}
        />
      </section>

      {SECCIONES.map(({ id, titulo }, index) => (
        <section key={id} className="bg-white rounded-2xl border border-brand-border p-4">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-brand-dark">
              {index + 1}. {titulo}
            </h2>
            <span className="text-sm font-semibold text-brand-dark tabular-nums">
              {formatMoney(calc.secciones[index].subtotal)}
            </span>
          </div>

          <ul className="space-y-3">
            {form.secciones[id].map((fila, i) => {
              const subtotal = subtotalItem({
                concepto: fila.concepto,
                cantidad: cantidadNum(fila.cantidad),
                precio: precioNum(fila.precio),
              })
              return (
                <li key={i} className="border-b border-brand-border/70 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <input
                      value={fila.concepto}
                      onChange={(e) => setFila(id, i, 'concepto', e.target.value)}
                      placeholder="Concepto"
                      aria-label="Concepto"
                      className="min-w-0 flex-1 rounded-lg border border-brand-border px-2.5 py-2 text-base focus:outline-none focus:border-brand-gold"
                    />
                    <button
                      type="button"
                      onClick={() => quitarFila(id, i)}
                      aria-label={`Quitar ${fila.concepto || 'renglón'}`}
                      className="h-9 w-9 flex-shrink-0 rounded-lg text-brand-muted hover:bg-brand-cream"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={fila.cantidad}
                      onChange={(e) => setFila(id, i, 'cantidad', e.target.value)}
                      inputMode="decimal"
                      placeholder="Cant."
                      aria-label={`Cantidad de ${fila.concepto}`}
                      className="w-20 rounded-lg border border-brand-border px-2.5 py-2 text-base text-right tabular-nums focus:outline-none focus:border-brand-gold"
                    />
                    <span className="text-brand-muted text-sm">×</span>
                    <input
                      value={fila.precio}
                      onChange={(e) => setFila(id, i, 'precio', e.target.value)}
                      inputMode="decimal"
                      placeholder="Precio"
                      aria-label={`Precio unitario de ${fila.concepto}`}
                      className="min-w-0 flex-1 rounded-lg border border-brand-border px-2.5 py-2 text-base text-right tabular-nums focus:outline-none focus:border-brand-gold"
                    />
                    <span
                      className={`w-28 flex-shrink-0 text-right text-sm tabular-nums ${
                        subtotal ? 'text-brand-dark font-semibold' : 'text-brand-muted/60'
                      }`}
                    >
                      {formatMoney(subtotal)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => agregarFila(id)}
            className="mt-3 text-xs font-semibold text-brand-dark underline underline-offset-2"
          >
            + Agregar renglón
          </button>
        </section>
      ))}

      <section className="bg-white rounded-2xl border border-brand-border p-4">
        <h2 className="text-sm font-semibold text-brand-dark mb-2">Forma de pago</h2>
        <ul className="divide-y divide-brand-border">
          {calc.etapas.map((etapa, i) => (
            <li key={etapa.titulo} className="py-2 flex items-baseline justify-between gap-3">
              <span className="text-sm text-brand-dark">
                Etapa {i + 1} · {etapa.titulo}
                <span className="text-brand-muted"> ({Math.round(etapa.pct * 100)} %)</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{formatMoney(etapa.monto)}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-brand-muted mt-2">
          Cada etapa es el total de su fase; la última se cobra como saldo. En el PDF no aparecen
          los renglones en cero.
        </p>
      </section>

      {presupuesto ? (
        <button
          type="button"
          onClick={borrar}
          disabled={busy !== ''}
          className="w-full text-xs font-semibold text-red-700 underline underline-offset-2 disabled:opacity-40"
        >
          {busy === 'borrar' ? 'Borrando…' : 'Borrar presupuesto'}
        </button>
      ) : null}

      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-brand-border bg-brand-cream px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-2">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-[11px] uppercase tracking-wide text-brand-muted">
                Precio final
              </span>
              <span className="font-serif text-xl text-brand-dark tabular-nums">
                {formatMoney(calc.total)}
              </span>
            </div>
            <button
              type="button"
              onClick={guardar}
              disabled={busy !== '' || !dirty || !form.cliente.trim()}
              className="rounded-xl bg-brand-dark text-brand-gold font-semibold px-5 py-3 disabled:opacity-40"
            >
              {busy === 'guardar' ? 'Guardando…' : dirty ? 'Guardar' : 'Guardado'}
            </button>
          </div>
          {presupuesto ? (
            <div className="grid grid-cols-2 gap-2">
              {/* El PDF sale de lo guardado: con cambios pendientes daría otra cosa. */}
              <a
                href={dirty ? undefined : `/api/admin/presupuestos/${presupuesto.id}/pdf`}
                aria-disabled={dirty}
                className={`rounded-xl border border-brand-dark text-brand-dark text-sm font-semibold py-2.5 text-center ${
                  dirty ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                Descargar PDF
              </a>
              <button
                type="button"
                onClick={marcarEnviado}
                disabled={busy !== '' || dirty || presupuesto.sentAt !== null}
                className="rounded-xl border border-brand-dark text-brand-dark text-sm font-semibold py-2.5 disabled:opacity-40"
              >
                {presupuesto.sentAt ? 'Ya enviado' : busy === 'enviado' ? 'Guardando…' : 'Marcar enviado'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
