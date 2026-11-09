'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_ERROR, CLASE_INPUT, Campo } from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'

export interface ProveedorEditable {
  id: string
  nombre: string
  telefono: string | null
  cuit: string | null
  rubro: string | null
  saldo_inicial: number
  activo: boolean
}

export default function ProveedorForm({
  proveedor,
  onListo,
}: {
  proveedor: ProveedorEditable | null
  onListo: () => void
}) {
  const router = useRouter()
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '')
  const [cuit, setCuit] = useState(proveedor?.cuit ?? '')
  const [rubro, setRubro] = useState(proveedor?.rubro ?? '')
  const [saldo, setSaldo] = useState<number | null>(proveedor?.saldo_inicial ?? 0)
  const [activo, setActivo] = useState(proveedor?.activo ?? true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef<string>(crypto.randomUUID())

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    if (!nombre.trim()) {
      setError('Escribí el nombre.')
      return
    }
    // MoneyInput da null tanto si está vacío como si no se pudo leer: guardar 0 en
    // ese caso borraría la deuda sin que nadie lo note.
    if (saldo === null) {
      setError('Revisá lo que ya le debías. Si no le debías nada, escribí 0.')
      return
    }
    setGuardando(true)
    setError(null)
    const datos = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      cuit: cuit.trim() || null,
      rubro: rubro.trim() || null,
      saldoInicial: saldo,
      activo,
    }
    const problema = proveedor
      ? await send('PATCH', `/api/admin/compras/proveedores/${proveedor.id}`, datos)
      : await send('POST', '/api/admin/compras/proveedores', { id: idRef.current, ...datos })
    setGuardando(false)
    if (problema) {
      setError(problema)
      return
    }
    onListo()
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <Campo label="Nombre">
        <input
          type="text"
          value={nombre}
          required
          maxLength={120}
          autoComplete="off"
          onChange={(evento) => setNombre(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Teléfono">
          <input
            type="tel"
            value={telefono}
            maxLength={40}
            autoComplete="off"
            onChange={(evento) => setTelefono(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo label="CUIT">
          <input
            type="text"
            inputMode="numeric"
            value={cuit}
            maxLength={20}
            autoComplete="off"
            onChange={(evento) => setCuit(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
      <Campo label="Rubro">
        <input
          type="text"
          value={rubro}
          maxLength={80}
          autoComplete="off"
          placeholder="Placas, herrajes, mesadas…"
          onChange={(evento) => setRubro(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>
      <MoneyInput label="Ya le debía antes de usar el panel" value={saldo} onChange={setSaldo} />
      {proveedor ? (
        <label className="flex items-center gap-2 text-sm text-brand-dark">
          <input
            type="checkbox"
            checked={activo}
            onChange={(evento) => setActivo(evento.target.checked)}
            className="h-5 w-5"
          />
          Activo (aparece al cargar compras y pagos)
        </label>
      ) : null}
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <button type="submit" disabled={guardando} className={CLASE_BOTON}>
        {guardando ? 'Guardando…' : proveedor ? 'Guardar cambios' : 'Agregar proveedor'}
      </button>
      <button type="button" onClick={onListo} className={CLASE_BOTON_SECUNDARIO}>
        Volver
      </button>
    </form>
  )
}
