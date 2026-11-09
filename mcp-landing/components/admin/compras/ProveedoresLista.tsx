'use client'

import Link from 'next/link'
import { useState } from 'react'
import ProveedorForm, { type ProveedorEditable } from '@/components/admin/compras/ProveedorForm'
import { CLASE_BOTON_PILL, CLASE_BOTON_SECUNDARIO, Empty, Panel } from '@/components/admin/gestion/ui'
import { formatMoney } from '@/lib/adminFormat'

export interface ProveedorListado extends ProveedorEditable {
  saldo: number
  vencido: number
  comprometido: number
}

function textoSaldo(saldo: number): string {
  if (saldo === 0) {
    return 'Al día'
  }
  return saldo > 0 ? formatMoney(saldo) : `${formatMoney(-saldo)} a favor`
}

export default function ProveedoresLista({ proveedores }: { proveedores: ProveedorListado[] }) {
  // El id del que se edita, o 'nuevo'.
  const [editando, setEditando] = useState<string | null>(null)
  const cerrar = () => setEditando(null)

  return (
    <Panel
      title="Proveedores"
      action={
        <button type="button" onClick={() => setEditando('nuevo')} className={CLASE_BOTON_PILL}>
          + Nuevo proveedor
        </button>
      }
    >
      {editando === 'nuevo' ? (
        <div className="mb-3 rounded-xl border border-brand-border bg-brand-cream p-3">
          <ProveedorForm proveedor={null} onListo={cerrar} />
        </div>
      ) : null}

      {proveedores.length === 0 ? (
        <Empty>Cargá primero a quienes ya les debés algo, con cuánto les debías antes de usar el panel.</Empty>
      ) : (
        <ul className="divide-y divide-brand-border/60">
          {proveedores.map((proveedor) => (
            <li key={proveedor.id} className="py-3">
              <div className="flex items-start gap-3">
                <Link
                  href={`/admin/compras/proveedores/${proveedor.id}`}
                  className="min-w-0 flex-1 flex items-start justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold truncate ${proveedor.activo ? 'text-brand-dark' : 'text-brand-muted'}`}>
                      {proveedor.nombre}
                    </span>
                    <span className="block text-xs text-brand-muted truncate">
                      {[proveedor.rubro, proveedor.activo ? null : 'Dado de baja'].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="text-right flex-shrink-0">
                    <span className="block text-sm font-semibold tabular-nums text-brand-dark">
                      {textoSaldo(proveedor.saldo)}
                    </span>
                    {proveedor.vencido > 0 ? (
                      <span className="block text-[11px] font-semibold tabular-nums text-red-700">
                        Vencido {formatMoney(proveedor.vencido)}
                      </span>
                    ) : null}
                    {proveedor.comprometido > 0 ? (
                      <span className="block text-[11px] tabular-nums text-brand-muted">
                        Pedidos {formatMoney(proveedor.comprometido)}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setEditando(proveedor.id)}
                  className={`${CLASE_BOTON_SECUNDARIO} flex-shrink-0`}
                >
                  Editar
                </button>
              </div>
              {editando === proveedor.id ? (
                <div className="mt-3 rounded-xl border border-brand-border bg-brand-cream p-3">
                  <ProveedorForm proveedor={proveedor} onListo={cerrar} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
