'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/admin/ContactDetails'
import { STATUS_LABELS, addDaysKey } from '@/lib/adminFormat'
import {
  CLOSED_STATUSES,
  CONVERSATION_STATUSES,
  MANUAL_LEAD_SOURCES,
  SOURCE_LABELS,
  type ConversationStatus,
  type LeadSource,
} from '@/lib/crm'

// Alta de un contacto que no pasó por el chat: el que escribió directo al
// WhatsApp, por Instagram, llamó o vino al local.
export default function NewLeadForm() {
  const router = useRouter()
  const [source, setSource] = useState<LeadSource>('whatsapp')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    zona: '',
    project: '',
    amount: '',
    status: 'nuevo' as ConversationStatus,
    // Por defecto, recordar escribirle mañana: un contacto sin fecha se olvida.
    follow_up_on: addDaysKey(1),
    note: '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source,
          amount: form.amount || null,
          follow_up_on: CLOSED_STATUSES.includes(form.status) ? null : form.follow_up_on,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!response.ok || !data.id) {
        setError(data.error ?? 'No se pudo guardar.')
        return
      }
      router.push(`/admin?c=${data.id}`)
      router.refresh()
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="bg-white rounded-2xl border border-brand-border p-4">
        <span className="block text-[11px] uppercase tracking-wide text-brand-muted mb-2">
          ¿Por dónde llegó?
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MANUAL_LEAD_SOURCES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSource(option)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                option === source
                  ? 'bg-brand-dark text-brand-gold border-brand-dark'
                  : 'bg-white text-brand-muted border-brand-border'
              }`}
            >
              {SOURCE_LABELS[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-brand-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nombre *" value={form.name} onChange={(v) => set('name', v)} required />
        <Input
          label="Teléfono"
          value={form.phone}
          onChange={(v) => set('phone', v)}
          type="tel"
          inputMode="tel"
          placeholder="342 408 1534"
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(v) => set('email', v)}
          type="email"
          inputMode="email"
        />
        <Input
          label="Zona"
          value={form.zona}
          onChange={(v) => set('zona', v)}
          placeholder="Santa Fe centro, Santo Tomé…"
        />
        <div className="sm:col-span-2">
          <Input
            label="Qué busca"
            value={form.project}
            onChange={(v) => set('project', v)}
            placeholder="Cocina en L de 3,20 m con mesada de granito"
          />
        </div>
        <Input
          label="Monto ($)"
          value={form.amount}
          onChange={(v) => set('amount', v)}
          inputMode="numeric"
          placeholder="Si ya hay presupuesto"
        />
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-brand-muted mb-1">
            Estado
          </span>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as ConversationStatus)}
            className="w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-base"
          >
            {CONVERSATION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Próximo seguimiento"
          value={form.follow_up_on}
          onChange={(v) => set('follow_up_on', v)}
          type="date"
        />
        <div className="sm:col-span-2">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-brand-muted mb-1">
              Nota
            </span>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              rows={3}
              placeholder="Lo que te contó, qué le prometiste…"
              className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:border-brand-gold resize-y"
            />
          </label>
        </div>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSaving || !form.name.trim()}
        className="w-full rounded-xl bg-brand-dark text-brand-gold font-semibold py-3 disabled:opacity-40"
      >
        {isSaving ? 'Guardando…' : 'Guardar contacto'}
      </button>
    </form>
  )
}
