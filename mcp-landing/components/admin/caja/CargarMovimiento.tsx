'use client'

import Link from 'next/link'
import { useState } from 'react'
import MovimientoForm from '@/components/admin/gestion/MovimientoForm'
import { Empty, Panel } from '@/components/admin/gestion/ui'
import type { OpcionesMovimiento } from '@/lib/gestion/tipos'

export default function CargarMovimiento({
  opciones,
  abiertoAlInicio,
}: {
  opciones: OpcionesMovimiento
  abiertoAlInicio: boolean
}) {
  // Sin setter a propósito: `open` no cambia nunca y el navegador maneja el toggle.
  // Así el primer movimiento guardado no cierra el formulario al refrescar la lista.
  const [abierto] = useState(abiertoAlInicio)
  const [guardado, setGuardado] = useState(false)

  if (opciones.cuentas.length === 0) {
    return (
      <Panel title="Cargar movimiento">
        <Empty>
          Para cargar movimientos necesitás al menos una cuenta.{' '}
          <Link href="/admin/caja/cuentas" className="underline underline-offset-2">
            Creá la primera acá
          </Link>
          .
        </Empty>
      </Panel>
    )
  }

  return (
    <details open={abierto} className="group bg-white rounded-2xl border border-brand-border p-4 min-w-0">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm font-semibold text-brand-dark [&::-webkit-details-marker]:hidden">
        Cargar movimiento
        <span aria-hidden className="text-brand-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="mt-3 max-w-2xl">
        <MovimientoForm
          opciones={opciones}
          onGuardado={() => {
            setGuardado(true)
            window.setTimeout(() => setGuardado(false), 4000)
          }}
        />
        {guardado ? (
          <p role="status" className="mt-2 text-sm text-green-700">
            Movimiento guardado.
          </p>
        ) : null}
      </div>
    </details>
  )
}
