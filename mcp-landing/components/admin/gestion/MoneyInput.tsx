'use client'

import { useEffect, useState } from 'react'
import { CLASE_ERROR, CLASE_ETIQUETA, CLASE_INPUT } from '@/components/admin/gestion/ui'
import { textoAMonto } from '@/lib/gestion/entrada'

const FORMATO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

function aTexto(valor: number | null): string {
  return valor === null ? '' : FORMATO.format(valor)
}

// Se tipea como en Argentina y entrega un número o null. Si lo escrito no se puede
// leer con certeza lo avisa ahí mismo, en vez de guardar otro monto.
export default function MoneyInput({
  label,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
}: {
  label: string
  value: number | null
  onChange: (valor: number | null) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [texto, setTexto] = useState(aTexto(value))

  // Cuando el formulario se limpia o se precarga desde afuera.
  useEffect(() => {
    if (textoAMonto(texto) !== value) {
      setTexto(aTexto(value))
    }
    // Solo reacciona al valor externo: incluir `texto` borraría lo que se está tipeando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const invalido = texto.trim() !== '' && textoAMonto(texto) === null

  return (
    <div className="min-w-0">
      <label className="block">
        <span className={CLASE_ETIQUETA}>{label}</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">$</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(evento) => {
              setTexto(evento.target.value)
              onChange(textoAMonto(evento.target.value))
            }}
            onBlur={() => {
              const valor = textoAMonto(texto)
              if (valor !== null) {
                setTexto(aTexto(valor))
              }
            }}
            className={`${CLASE_INPUT} pl-7 tabular-nums ${invalido ? 'border-red-400' : ''}`}
          />
        </div>
      </label>
      {invalido ? <p className={`${CLASE_ERROR} mt-1`}>Escribilo así: 1.500.000</p> : null}
    </div>
  )
}
