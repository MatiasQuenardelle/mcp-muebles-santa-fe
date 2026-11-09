'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CLASE_ERROR, CLASE_SELECT } from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import { ETAPAS_OBRA, ETAPA_LABELS, type EtapaObra } from '@/lib/gestion/tipos'

export default function SelectorEtapa({ obraId, etapa }: { obraId: string; etapa: EtapaObra }) {
  const router = useRouter()
  const [valor, setValor] = useState(etapa)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cuando otra persona la cambió y la pantalla se refrescó.
  useEffect(() => {
    setValor(etapa)
  }, [etapa])

  async function cambiar(nueva: EtapaObra) {
    const anterior = valor
    setValor(nueva)
    setGuardando(true)
    setError(null)
    const problema = await send('PATCH', `/api/admin/obras/${obraId}/etapa`, { etapa: nueva })
    setGuardando(false)
    if (problema) {
      setValor(anterior)
      setError(problema)
      return
    }
    router.refresh()
  }

  return (
    <div className="min-w-0">
      <select
        value={valor}
        disabled={guardando}
        aria-label="Etapa de la obra"
        onChange={(evento) => cambiar(evento.target.value as EtapaObra)}
        className={`${CLASE_SELECT} disabled:opacity-60`}
      >
        {ETAPAS_OBRA.map((opcion) => (
          <option key={opcion} value={opcion}>
            {ETAPA_LABELS[opcion]}
          </option>
        ))}
      </select>
      {error ? <p className={`${CLASE_ERROR} mt-1`}>{error}</p> : null}
    </div>
  )
}
