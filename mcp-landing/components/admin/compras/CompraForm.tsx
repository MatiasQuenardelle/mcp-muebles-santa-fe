'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { cantidadATexto, textoACantidad } from '@/components/admin/compras/cantidad'
import { fechaCorta } from '@/components/admin/compras/estado'
import MoneyInput from '@/components/admin/gestion/MoneyInput'
import {
  CLASE_BOTON,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Panel,
} from '@/components/admin/gestion/ui'
import { send } from '@/lib/adminApi'
import { formatMoney, todayKey } from '@/lib/adminFormat'
import { redondear } from '@/lib/gestion/calculos'
import type { CompraDetalle, UltimoPrecio } from '@/lib/gestion/compras'
import type { OpcionesMovimiento } from '@/lib/gestion/tipos'

type OpcionProveedor = OpcionesMovimiento['proveedores'][number]

interface Fila {
  // Clave estable: MoneyInput guarda lo tipeado y con el índice se mezclaría al quitar.
  clave: number
  descripcion: string
  cantidad: string
  precio: number | null
  obraId: string
}

const ID_SUGERENCIAS = 'compra-descripciones'
const idDescripcion = (clave: number) => `compra-renglon-${clave}`
const clavePrecio = (descripcion: string) => descripcion.trim().toLowerCase()

// Solo para ver cómo va la cuenta: al servidor viajan los renglones, nunca un total.
function subtotalDe(fila: Fila): number {
  const cantidad = textoACantidad(fila.cantidad)
  return cantidad === null || fila.precio === null ? 0 : redondear(cantidad * fila.precio)
}

function ProveedorRapido({ onCreado }: { onCreado: (proveedor: OpcionProveedor) => void }) {
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef<string>(crypto.randomUUID())

  async function crear() {
    if (guardando) {
      return
    }
    if (!nombre.trim()) {
      setError('Escribí el nombre.')
      return
    }
    setGuardando(true)
    setError(null)
    const problema = await send('POST', '/api/admin/compras/proveedores', {
      id: idRef.current,
      nombre: nombre.trim(),
      telefono: null,
      cuit: null,
      rubro: null,
      saldoInicial: 0,
      activo: true,
    })
    setGuardando(false)
    if (problema) {
      setError(problema)
      return
    }
    onCreado({ id: idRef.current, nombre: nombre.trim() })
  }

  return (
    <div className="mt-2 rounded-xl border border-brand-border bg-brand-cream p-3 space-y-2">
      <Campo label="Nombre del proveedor nuevo">
        <input
          type="text"
          value={nombre}
          maxLength={120}
          autoComplete="off"
          onChange={(evento) => setNombre(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault()
              crear()
            }
          }}
          className={CLASE_INPUT}
        />
      </Campo>
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-brand-muted min-w-0">El teléfono y el CUIT se completan después.</p>
        <button
          type="button"
          disabled={guardando}
          onClick={crear}
          className="flex-shrink-0 rounded-full bg-brand-dark text-brand-gold text-xs font-semibold px-3 py-2 disabled:opacity-40"
        >
          {guardando ? 'Agregando…' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}

export default function CompraForm({
  proveedores: proveedoresIniciales,
  obras,
  ultimos,
  compra = null,
}: {
  proveedores: OpcionProveedor[]
  obras: OpcionesMovimiento['obras']
  ultimos: UltimoPrecio[]
  compra?: CompraDetalle | null
}) {
  const router = useRouter()
  const siguienteClave = useRef(0)
  function filaVacia(obraId = ''): Fila {
    siguienteClave.current += 1
    return { clave: siguienteClave.current, descripcion: '', cantidad: '1', precio: null, obraId }
  }

  const [proveedores, setProveedores] = useState(proveedoresIniciales)
  const [proveedorId, setProveedorId] = useState(compra?.proveedor_id ?? '')
  const [agregandoProveedor, setAgregandoProveedor] = useState(proveedoresIniciales.length === 0)
  const [fecha, setFecha] = useState(compra?.fecha ?? todayKey())
  const [comprobante, setComprobante] = useState(compra?.comprobante ?? '')
  const [venceEl, setVenceEl] = useState(compra?.vence_el ?? '')
  const [estado, setEstado] = useState<'pedido' | 'recibido'>('pedido')
  const [filas, setFilas] = useState<Fila[]>(() =>
    compra
      ? compra.items.map((item) => {
          siguienteClave.current += 1
          return {
            clave: siguienteClave.current,
            descripcion: item.descripcion,
            cantidad: cantidadATexto(item.cantidad),
            precio: item.precio,
            obraId: item.obra_id ?? '',
          }
        })
      : [filaVacia()]
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Se conserva entre reintentos: un error de red no puede cargar la compra dos veces.
  const idRef = useRef<string>(compra?.id ?? crypto.randomUUID())

  const precios = useMemo(
    () => new Map(ultimos.map((ultimo) => [clavePrecio(ultimo.descripcion), ultimo])),
    [ultimos]
  )
  const total = redondear(filas.reduce((suma, fila) => suma + subtotalDe(fila), 0))

  function actualizar(clave: number, cambios: Partial<Fila>) {
    setFilas((actuales) => actuales.map((fila) => (fila.clave === clave ? { ...fila, ...cambios } : fila)))
  }

  function agregarRenglon() {
    // Lo común es que varios renglones seguidos sean para la misma obra.
    const nueva = filaVacia(filas[filas.length - 1]?.obraId ?? '')
    // flushSync: el foco tiene que darse dentro del toque para que el iPhone abra el teclado.
    flushSync(() => setFilas((actuales) => [...actuales, nueva]))
    document.getElementById(idDescripcion(nueva.clave))?.focus()
  }

  function quitarRenglon(clave: number) {
    setFilas((actuales) => actuales.filter((fila) => fila.clave !== clave))
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (guardando) {
      return
    }
    if (!proveedorId) {
      setError('Elegí el proveedor.')
      return
    }

    const renglones: { descripcion: string; cantidad: number; precio: number; obraId: string | null }[] = []
    for (let indice = 0; indice < filas.length; indice += 1) {
      const fila = filas[indice]
      // Un renglón que se agregó y quedó en blanco no es un error.
      if (!fila.descripcion.trim() && fila.precio === null) {
        continue
      }
      const cantidad = textoACantidad(fila.cantidad)
      const numero = indice + 1
      if (!fila.descripcion.trim()) {
        setError(`Renglón ${numero}: falta la descripción.`)
        return
      }
      if (cantidad === null) {
        setError(`Renglón ${numero}: revisá la cantidad.`)
        return
      }
      if (fila.precio === null) {
        setError(`Renglón ${numero}: revisá el precio. Si no tiene costo, escribí 0.`)
        return
      }
      renglones.push({
        descripcion: fila.descripcion.trim(),
        cantidad,
        precio: fila.precio,
        obraId: fila.obraId || null,
      })
    }
    if (renglones.length === 0) {
      setError('Cargá al menos un renglón.')
      return
    }

    setGuardando(true)
    setError(null)
    const datos = {
      proveedorId,
      fecha,
      comprobante: comprobante.trim() || null,
      venceEl: venceEl || null,
      renglones,
    }
    const problema = compra
      ? await send('PATCH', `/api/admin/compras/${compra.id}`, { accion: 'editar', ...datos })
      : await send('POST', '/api/admin/compras', { id: idRef.current, estado, ...datos })
    if (problema) {
      setGuardando(false)
      setError(problema)
      return
    }
    router.replace(`/admin/compras/${idRef.current}`)
    router.refresh()
  }

  return (
    <form
      onSubmit={guardar}
      onChange={() => setError(null)}
      // El "Intro" del teclado del celular guardaría la compra con los renglones a medias.
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' && evento.target instanceof HTMLInputElement) {
          evento.preventDefault()
        }
      }}
      className="space-y-4"
    >
      <Panel title="Datos de la compra">
        <div className="space-y-3">
          <div>
            <Campo label="Proveedor">
              <select
                value={proveedorId}
                onChange={(evento) => setProveedorId(evento.target.value)}
                className={CLASE_SELECT}
              >
                <option value="">Elegir…</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            {agregandoProveedor ? (
              <ProveedorRapido
                onCreado={(nuevo) => {
                  setProveedores((actuales) =>
                    [...actuales, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
                  )
                  setProveedorId(nuevo.id)
                  setAgregandoProveedor(false)
                }}
              />
            ) : (
              <button type="button" onClick={() => setAgregandoProveedor(true)} className={`${CLASE_BOTON_SECUNDARIO} mt-2`}>
                + Proveedor nuevo
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Campo label="Fecha">
              <input
                type="date"
                value={fecha}
                required
                onChange={(evento) => setFecha(evento.target.value)}
                className={`${CLASE_INPUT} min-w-0`}
              />
            </Campo>
            <Campo label="Vence (opcional)">
              <input
                type="date"
                value={venceEl}
                min={fecha}
                onChange={(evento) => setVenceEl(evento.target.value)}
                className={`${CLASE_INPUT} min-w-0`}
              />
            </Campo>
          </div>

          <Campo label="N° de factura o remito (opcional)">
            <input
              type="text"
              value={comprobante}
              maxLength={100}
              autoComplete="off"
              onChange={(evento) => setComprobante(evento.target.value)}
              className={CLASE_INPUT}
            />
          </Campo>

          {compra ? null : (
            <div>
              <span className={CLASE_ETIQUETA}>¿Ya llegó?</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ['pedido', 'Es un pedido'],
                    ['recibido', 'Ya la recibí'],
                  ] as const
                ).map(([opcion, label]) => (
                  <button
                    key={opcion}
                    type="button"
                    aria-pressed={estado === opcion}
                    onClick={() => setEstado(opcion)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold ${
                      estado === opcion ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-brand-muted">
                {estado === 'pedido'
                  ? 'Todavía no suma a la deuda ni al costo de las obras.'
                  : 'Suma ya a la deuda con el proveedor y al costo de las obras. Después solo se puede cancelar.'}
              </p>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Renglones">
        <datalist id={ID_SUGERENCIAS}>
          {ultimos.map((ultimo) => (
            <option key={ultimo.descripcion} value={ultimo.descripcion} />
          ))}
        </datalist>

        <div className="space-y-3">
          {filas.map((fila, indice) => {
            const ultimo = precios.get(clavePrecio(fila.descripcion))
            const cantidadInvalida = fila.cantidad.trim() !== '' && textoACantidad(fila.cantidad) === null
            return (
              <div key={fila.clave} className="rounded-xl border border-brand-border bg-brand-cream p-3 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-brand-dark">Renglón {indice + 1}</span>
                  {filas.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => quitarRenglon(fila.clave)}
                      className="text-xs text-brand-muted underline underline-offset-2 px-2 py-1 -mr-2"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>

                <Campo label="Descripción">
                  <input
                    id={idDescripcion(fila.clave)}
                    type="text"
                    list={ID_SUGERENCIAS}
                    value={fila.descripcion}
                    maxLength={300}
                    autoComplete="off"
                    onChange={(evento) => actualizar(fila.clave, { descripcion: evento.target.value })}
                    className={CLASE_INPUT}
                  />
                </Campo>

                {ultimo ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-brand-muted min-w-0">
                      Último precio: <span className="font-semibold tabular-nums">{formatMoney(ultimo.precio)}</span> ·{' '}
                      {ultimo.proveedor_nombre} · {fechaCorta(ultimo.fecha)}
                    </p>
                    {fila.precio !== ultimo.precio ? (
                      <button
                        type="button"
                        onClick={() => actualizar(fila.clave, { precio: ultimo.precio })}
                        className={`${CLASE_BOTON_SECUNDARIO} flex-shrink-0`}
                      >
                        Usar
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <Campo label="Cantidad">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={fila.cantidad}
                        onChange={(evento) => actualizar(fila.clave, { cantidad: evento.target.value })}
                        className={`${CLASE_INPUT} tabular-nums ${cantidadInvalida ? 'border-red-400' : ''}`}
                      />
                    </Campo>
                    {cantidadInvalida ? <p className={`${CLASE_ERROR} mt-1`}>Escribila así: 2,5</p> : null}
                  </div>
                  <MoneyInput
                    label="Precio unitario"
                    value={fila.precio}
                    onChange={(precio) => actualizar(fila.clave, { precio })}
                  />
                </div>

                <Campo label="Obra (opcional)">
                  <select
                    value={fila.obraId}
                    onChange={(evento) => actualizar(fila.clave, { obraId: evento.target.value })}
                    className={CLASE_SELECT}
                  >
                    <option value="">Sin obra (stock del taller)</option>
                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>
                        {obra.numero} · {obra.cliente} · {obra.titulo}
                      </option>
                    ))}
                  </select>
                </Campo>

                <p className="text-right text-xs text-brand-muted tabular-nums">
                  Subtotal <span className="font-semibold text-brand-dark">{formatMoney(subtotalDe(fila))}</span>
                </p>
              </div>
            )
          })}

          <button
            type="button"
            onClick={agregarRenglon}
            className="w-full rounded-xl border border-dashed border-brand-muted-dark py-3 text-sm font-semibold text-brand-dark"
          >
            + Agregar renglón
          </button>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 border-t border-brand-border bg-brand-card px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2">
        {error ? <p className={CLASE_ERROR}>{error}</p> : null}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-brand-muted">Total</div>
            <div className="text-xl font-semibold tabular-nums text-brand-dark truncate">{formatMoney(total)}</div>
          </div>
          <button type="submit" disabled={guardando} className={CLASE_BOTON}>
            {guardando ? 'Guardando…' : compra ? 'Guardar cambios' : 'Guardar compra'}
          </button>
        </div>
      </div>
    </form>
  )
}
