'use client'

import { ETIQUETAS_MODO, MODOS_BOT, type ModoBot } from '@/lib/whatsapp/modo'

interface Props {
  value: ModoBot
  disabled: boolean
  onChange: (mode: ModoBot) => void
}

export default function SelectorModo({ value, disabled, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Modo del bot" className="grid grid-cols-3 gap-1 rounded-xl bg-brand-card p-1">
      {MODOS_BOT.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          disabled={disabled}
          onClick={() => onChange(mode)}
          className={`min-h-9 rounded-lg px-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
            value === mode ? 'bg-brand-dark text-white' : 'text-brand-muted'
          }`}
        >
          {ETIQUETAS_MODO[mode]}
        </button>
      ))}
    </div>
  )
}
