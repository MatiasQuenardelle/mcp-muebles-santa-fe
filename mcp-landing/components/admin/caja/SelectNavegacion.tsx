'use client'

import { useRouter } from 'next/navigation'
import { CLASE_SELECT, Campo } from '@/components/admin/gestion/ui'

// Un filtro en la URL con demasiadas opciones para chips. Cada opción ya trae su
// link armado desde el servidor; la `key` lo realinea si el filtro cambia por otro lado.
export default function SelectNavegacion({
  etiqueta,
  actual,
  opciones,
}: {
  etiqueta: string
  actual: string
  opciones: { href: string; label: string }[]
}) {
  const router = useRouter()
  return (
    <Campo label={etiqueta}>
      <select
        key={actual}
        defaultValue={actual}
        onChange={(evento) => router.push(evento.target.value, { scroll: false })}
        className={CLASE_SELECT}
      >
        {opciones.map((opcion) => (
          <option key={opcion.href} value={opcion.href}>
            {opcion.label}
          </option>
        ))}
      </select>
    </Campo>
  )
}
