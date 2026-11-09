import Link from 'next/link'
import { CLASE_CHIP_ACTIVO, CLASE_CHIP_INACTIVO } from '@/components/admin/gestion/ui'

export interface OpcionChip {
  href: string
  label: string
  activo: boolean
}

// Links y no botones: el filtro vive en la URL, como en la lista de contactos.
export default function Chips({ titulo, opciones }: { titulo: string; opciones: OpcionChip[] }) {
  return (
    <div role="group" aria-label={titulo} className="flex flex-wrap gap-1.5">
      {opciones.map((opcion) => (
        <Link
          key={opcion.label}
          href={opcion.href}
          scroll={false}
          aria-current={opcion.activo ? 'true' : undefined}
          className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border ${
            opcion.activo ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
          }`}
        >
          {opcion.label}
        </Link>
      ))}
    </div>
  )
}
