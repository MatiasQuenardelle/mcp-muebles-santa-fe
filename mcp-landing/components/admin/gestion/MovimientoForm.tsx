'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import {
  CLASE_BOTON,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
  CLASE_ERROR,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
} from '@/components/admin/gestion/ui'
import { crearMovimientoRequest } from '@/lib/adminApi'
import { todayKey } from '@/lib/adminFormat'
import { tipoDeCategoria } from '@/lib/gestion/calculos'
import {
  TIPO_MOVIMIENTO_LABELS,
  type ClaveCategoria,
  type MovimientoNuevo,
  type OpcionesMovimiento,
  type TipoMovimiento,
} from '@/lib/gestion/tipos'

const GRUPO_TITULOS = { ingreso: 'Ingresos', negocio: 'Negocio', familia: 'Familia' } as const

export interface MovimientoFormProps {
  opciones: OpcionesMovimiento
  // Fija la categoría: "Registrar cobro" en una obra, "Pagar" en un proveedor.
  claveFija?: ClaveCategoria
  preset?: Partial<MovimientoNuevo>
  // Campos que vienen dados por la pantalla y no se muestran.
  bloquear?: (keyof MovimientoNuevo)[]
  textoBoton?: string
  onGuardado?: () => void
}

export default function MovimientoForm({
  opciones,
  claveFija,
  preset = {},
  bloquear = [],
  textoBoton = 'Guardar',
  onGuardado,
}: MovimientoFormProps) {
  const router = useRouter()
  const categoriaFija = claveFija ? opciones.categorias.find((c) => c.clave === claveFija) : undefined

  const [tipo, setTipo] = useState<TipoMovimiento>(
    categoriaFija ? tipoDeCategoria(categoriaFija) : (preset.tipo ?? 'egreso')
  )
  const [monto, setMonto] = useState<number | null>(preset.monto ?? null)
  const [fecha, setFecha] = useState(preset.fecha ?? todayKey())
  const [cuentaId, setCuentaId] = useState(preset.cuentaId ?? opciones.cuentas[0]?.id ?? '')
  const [cuentaDestinoId, setCuentaDestinoId] = useState(preset.cuentaDestinoId ?? '')
  const [categoriaId, setCategoriaId] = useState(categoriaFija?.id ?? preset.categoriaId ?? '')
  const [obraId, setObraId] = useState(preset.obraId ?? '')
  const [proveedorId, setProveedorId] = useState(preset.proveedorId ?? '')
  const [personalId, setPersonalId] = useState(preset.personalId ?? '')
  const [nota, setNota] = useState(preset.nota ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Se renueva solo después de guardar bien: reintentar tras un error de red no
  // puede cargar el movimiento dos veces.
  const idRef = useRef<string>(crypto.randomUUID())

  const categoria = opciones.categorias.find((c) => c.id === categoriaId)
  const visible = (campo: keyof MovimientoNuevo) => !bloquear.includes(campo)

  const categoriasDelTipo = useMemo(
    () => opciones.categorias.filter((c) => tipo !== 'transferencia' && tipoDeCategoria(c) === tipo),
    [opciones.categorias, tipo]
  )
  const grupos = (['ingreso', 'negocio', 'familia'] as const)
    .map((grupo) => ({ grupo, items: categoriasDelTipo.filter((c) => c.grupo === grupo) }))
    .filter((entrada) => entrada.items.length > 0)

  const clave = categoria?.clave ?? null
  const pideObra =
    tipo !== 'transferencia' &&
    (clave === 'cobro_obra' || clave === 'devolucion_cliente' || (categoria?.grupo === 'negocio' && clave === null))
  const obraObligatoria = clave === 'cobro_obra' || clave === 'devolucion_cliente'
  const pideProveedor = clave === 'pago_proveedor' || clave === 'devolucion_proveedor'
  const pidePersona = clave === 'comision' || (categoria?.grupo === 'negocio' && clave === null)
  const personaObligatoria = clave === 'comision'

  function cambiarTipo(nuevo: TipoMovimiento) {
    setTipo(nuevo)
    setCategoriaId('')
    setObraId('')
    setProveedorId('')
    setPersonalId('')
    setError(null)
  }

  function cambiarCategoria(id: string) {
    setCategoriaId(id)
    setObraId(bloquear.includes('obraId') ? obraId : '')
    setProveedorId(bloquear.includes('proveedorId') ? proveedorId : '')
    setPersonalId(bloquear.includes('personalId') ? personalId : '')
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    if (monto === null || monto <= 0) {
      setError('Escribí el monto.')
      return
    }
    setGuardando(true)
    setError(null)
    const esTransferencia = tipo === 'transferencia'
    const problema = await crearMovimientoRequest({
      id: idRef.current,
      fecha,
      tipo,
      monto,
      cuentaId,
      cuentaDestinoId: esTransferencia ? cuentaDestinoId || null : null,
      categoriaId: esTransferencia ? null : categoriaId || null,
      obraId: pideObra ? obraId || null : null,
      proveedorId: pideProveedor ? proveedorId || null : null,
      personalId: pidePersona ? personalId || null : null,
      nota: nota.trim() || null,
    })
    setGuardando(false)
    if (problema) {
      setError(problema)
      return
    }
    idRef.current = crypto.randomUUID()
    setMonto(null)
    setNota('')
    onGuardado?.()
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      {!categoriaFija && visible('tipo') ? (
        <div className="grid grid-cols-3 gap-1.5">
          {(['ingreso', 'egreso', 'transferencia'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => cambiarTipo(opcion)}
              className={`rounded-xl border py-2 text-xs font-semibold ${
                tipo === opcion ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
              }`}
            >
              {TIPO_MOVIMIENTO_LABELS[opcion]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <MoneyInput label="Monto" value={monto} onChange={setMonto} />
        <Campo label="Fecha">
          <input
            type="date"
            value={fecha}
            required
            onChange={(evento) => setFecha(evento.target.value)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>

      <div className={`grid gap-2 ${tipo === 'transferencia' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Campo label={tipo === 'transferencia' ? 'Sale de' : 'Cuenta'}>
          <select value={cuentaId} required onChange={(evento) => setCuentaId(evento.target.value)} className={CLASE_SELECT}>
            {opciones.cuentas.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </select>
        </Campo>
        {tipo === 'transferencia' ? (
          <Campo label="Entra a">
            <select
              value={cuentaDestinoId}
              required
              onChange={(evento) => setCuentaDestinoId(evento.target.value)}
              className={CLASE_SELECT}
            >
              <option value="">Elegir…</option>
              {opciones.cuentas
                .filter((cuenta) => cuenta.id !== cuentaId)
                .map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre}
                  </option>
                ))}
            </select>
          </Campo>
        ) : null}
      </div>

      {!categoriaFija && tipo !== 'transferencia' ? (
        <Campo label="Categoría">
          <select
            value={categoriaId}
            required
            onChange={(evento) => cambiarCategoria(evento.target.value)}
            className={CLASE_SELECT}
          >
            <option value="">Elegir…</option>
            {grupos.map(({ grupo, items }) => (
              <optgroup key={grupo} label={GRUPO_TITULOS[grupo]}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Campo>
      ) : null}

      {pideObra && visible('obraId') ? (
        <Campo label={obraObligatoria ? 'Obra' : 'Obra (si es un gasto de una obra)'}>
          <select
            value={obraId}
            required={obraObligatoria}
            onChange={(evento) => setObraId(evento.target.value)}
            className={CLASE_SELECT}
          >
            <option value="">{obraObligatoria ? 'Elegir…' : 'Ninguna'}</option>
            {opciones.obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.numero} · {obra.cliente} · {obra.titulo}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      {pideProveedor && visible('proveedorId') ? (
        <Campo label="Proveedor">
          <select
            value={proveedorId}
            required
            onChange={(evento) => setProveedorId(evento.target.value)}
            className={CLASE_SELECT}
          >
            <option value="">Elegir…</option>
            {opciones.proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      {pidePersona && visible('personalId') ? (
        <Campo label={personaObligatoria ? 'Persona' : 'Persona (si es un sueldo o adelanto)'}>
          <select
            value={personalId}
            required={personaObligatoria}
            onChange={(evento) => setPersonalId(evento.target.value)}
            className={CLASE_SELECT}
          >
            <option value="">{personaObligatoria ? 'Elegir…' : 'Ninguna'}</option>
            {opciones.personal.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.nombre}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      <Campo label="Nota (opcional)">
        <input
          type="text"
          value={nota}
          maxLength={500}
          onChange={(evento) => setNota(evento.target.value)}
          className={CLASE_INPUT}
        />
      </Campo>

      {error ? <p className={CLASE_ERROR}>{error}</p> : null}

      <button type="submit" disabled={guardando} className={CLASE_BOTON}>
        {guardando ? 'Guardando…' : textoBoton}
      </button>
    </form>
  )
}
