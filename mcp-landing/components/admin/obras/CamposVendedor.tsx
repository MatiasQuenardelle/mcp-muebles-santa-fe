'use client'

import { CLASE_INPUT, CLASE_SELECT, Campo } from '@/components/admin/gestion/ui'
import type { Vendedor } from '@/lib/gestion/obras'

export function pctATexto(valor: number): string {
  return String(valor).replace('.', ',')
}

/** "2,5" o "2.5". Null si no se entiende: hay que pedirlo de nuevo, no asumir cero. */
export function textoAPct(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') {
    return null
  }
  const valor = Number(limpio)
  return Number.isFinite(valor) && valor >= 0 && valor <= 100 ? valor : null
}

export default function CamposVendedor({
  vendedores,
  vendedorId,
  comision,
  onVendedor,
  onComision,
}: {
  vendedores: Vendedor[]
  vendedorId: string
  comision: string
  onVendedor: (id: string, comisionSugerida: string) => void
  onComision: (texto: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Campo label="Vendedor (opcional)">
        <select
          value={vendedorId}
          onChange={(evento) => {
            const elegido = vendedores.find((vendedor) => vendedor.id === evento.target.value)
            onVendedor(evento.target.value, elegido ? pctATexto(elegido.comision_pct) : '0')
          }}
          className={CLASE_SELECT}
        >
          <option value="">Sin vendedor</option>
          {vendedores.map((vendedor) => (
            <option key={vendedor.id} value={vendedor.id}>
              {vendedor.nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Comisión (%)">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={vendedorId ? comision : '0'}
          disabled={!vendedorId}
          onChange={(evento) => onComision(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
    </div>
  )
}
