'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteConversationRequest, patchConversation } from '@/lib/adminApi'
import { formatMoney } from '@/lib/adminFormat'
import { LEAD_SOURCES, MANUAL_LEAD_SOURCES, SOURCE_LABELS, type LeadSource } from '@/lib/crm'

interface Props {
  id: string
  source: LeadSource
  status: string
  values: {
    nombre: string | null
    telefono: string | null
    email: string | null
    zona: string | null
    proyecto: string | null
  }
  amount: number | null
  lostReason: string | null
  origin: string
}

// Ficha del contacto. Muestra lo que hay (editado a mano o, si no, lo que sacó
// la tarjeta IA) y al editar guarda en las columnas propias, que pasan a mandar.
export default function ContactDetails({
  id,
  source,
  status,
  values,
  amount,
  lostReason,
  origin,
}: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(() => initialForm())
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function initialForm() {
    return {
      name: values.nombre ?? '',
      phone: values.telefono ?? '',
      email: values.email ?? '',
      zona: values.zona ?? '',
      project: values.proyecto ?? '',
      source,
      amount: amount === null ? '' : String(amount),
      lost_reason: lostReason ?? '',
    }
  }

  function set<K extends keyof ReturnType<typeof initialForm>>(key: K, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    const failure = await patchConversation(id, { ...form, amount: form.amount || null })
    setIsSaving(false)
    if (failure) {
      setError(failure)
      return
    }
    setIsEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!window.confirm('¿Borrar este contacto con todo su historial? No se puede deshacer.')) {
      return
    }
    const failure = await deleteConversationRequest(id)
    if (failure) {
      setError(failure)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  if (!isEditing) {
    return (
      <section className="bg-white rounded-2xl border border-brand-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand-dark">Datos</h2>
          <button
            onClick={() => {
              setForm(initialForm())
              setIsEditing(true)
            }}
            className="text-[11px] font-semibold text-brand-muted border border-brand-border rounded-full px-3 py-1"
          >
            Editar
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Teléfono" value={values.telefono} />
          <Field label="Email" value={values.email} />
          <Field label="Zona" value={values.zona} />
          <Field label="Origen" value={origin} />
          <Field label="Monto" value={amount === null ? null : formatMoney(amount)} />
          {status === 'perdido' ? <Field label="Motivo de pérdida" value={lostReason} /> : null}
          <div className="col-span-2">
            <Field label="Proyecto" value={values.proyecto} />
          </div>
        </dl>
      </section>
    )
  }

  // Un chat del asistente sigue siendo un chat aunque se editen sus datos; el
  // origen solo se elige entre los canales manuales.
  const sourceOptions = source === 'chat' ? LEAD_SOURCES : MANUAL_LEAD_SOURCES

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-brand-gold/60 p-4">
      <h2 className="text-sm font-semibold text-brand-dark mb-3">Editar datos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nombre" value={form.name} onChange={(v) => set('name', v)} />
        <Input
          label="Teléfono"
          value={form.phone}
          onChange={(v) => set('phone', v)}
          type="tel"
          inputMode="tel"
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(v) => set('email', v)}
          type="email"
          inputMode="email"
        />
        <Input label="Zona" value={form.zona} onChange={(v) => set('zona', v)} />
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-brand-muted mb-1">
            Origen
          </span>
          <select
            value={form.source}
            onChange={(e) => set('source', e.target.value)}
            disabled={source === 'chat'}
            className="w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-base disabled:opacity-60"
          >
            {sourceOptions.map((option) => (
              <option key={option} value={option}>
                {SOURCE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Monto ($)"
          value={form.amount}
          onChange={(v) => set('amount', v)}
          inputMode="numeric"
          placeholder="Presupuestado o vendido"
        />
        <div className="sm:col-span-2">
          <Input
            label="Proyecto"
            value={form.project}
            onChange={(v) => set('project', v)}
            placeholder="Cocina en L de 3,20 m, alacena, mesada de granito…"
          />
        </div>
        {status === 'perdido' ? (
          <div className="sm:col-span-2">
            <Input
              label="Motivo de pérdida"
              value={form.lost_reason}
              onChange={(v) => set('lost_reason', v)}
              placeholder="Precio, eligió a otro, no respondió…"
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-brand-dark text-brand-gold text-sm font-semibold px-4 py-2.5 disabled:opacity-40"
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded-xl border border-brand-border text-sm font-semibold px-4 py-2.5 text-brand-dark"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto text-xs font-semibold text-red-700 underline underline-offset-2"
        >
          Borrar contacto
        </button>
      </div>
    </form>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className={`text-sm break-words ${value ? 'text-brand-dark' : 'text-brand-muted/60'}`}>
        {value || '—'}
      </dd>
    </div>
  )
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-brand-muted mb-1">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        // text-base: con menos de 16px el iPhone hace zoom al enfocar.
        className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:border-brand-gold"
      />
    </label>
  )
}
