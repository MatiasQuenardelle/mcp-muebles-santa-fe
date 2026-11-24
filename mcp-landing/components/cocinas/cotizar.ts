// Cálculo del presupuesto de la calculadora de /cocinas. Lo usan la calculadora
// (navegador) y /api/presupuesto (servidor, que recalcula y nunca confía en el
// total del navegador), así que los dos dan siempre el mismo número.
import {
  ADICIONALES,
  EXTRAS,
  MESADAS,
  PILETAS,
  TOPE_DE_GAMA,
  precioMesada,
  precioModulo,
  tiras,
  type AdicionalId,
  type LineaId,
  type MesadaId,
  type ModuloId,
  type PiletaId,
} from '@/lib/precios.mjs'

// Cada lado se cotiza de a 10 cm entre LARGO_MIN y LARGO_MAX. Una cocina en L
// o en U es un módulo con dos o tres lados.
export const LARGO_MIN = 60
export const LARGO_MAX = 600
export const LARGO_PASO = 10
export const MAX_LADOS = 3

export const LINEA_IDS: LineaId[] = ['economica', 'estandar', 'premium', 'topeDeGama']
const MODULO_IDS: ModuloId[] = ['bajoMesada', 'alacena', 'mesada']

export interface ModuloElegido {
  incluido: boolean
  /** Largo de cada lado en cm: uno si es recta, dos si es en L, tres si es en U. */
  lados: number[]
}

export interface Seleccion {
  linea: LineaId
  bajoMesada: ModuloElegido
  alacena: ModuloElegido
  mesada: ModuloElegido & { material: MesadaId }
  pileta: PiletaId | null
  adicionales: AdicionalId[]
  /** Fuera de Tope de Gama: luces LED en la alacena, por tira de 3 m. */
  led: boolean
  /** Fuera de Tope de Gama: puertas con vidrio perfil GrupoEuro. */
  puertasVidrio: number
  /** Solo Tope de Gama: cajones con correderas de cierre suave. */
  cajones: number
  /** Solo Tope de Gama. */
  color: string
}

export interface Renglon {
  nombre: string
  /** Con unidad: "3,50 + 2,70 m", "1 u.", "3 cajones". */
  medida: string
  precio: number
  /** Reemplaza al precio cuando no suma: "A consultar". */
  nota?: string
}

export const SELECCION_INICIAL: Seleccion = {
  linea: 'estandar',
  bajoMesada: { incluido: true, lados: [200] },
  alacena: { incluido: true, lados: [160] },
  mesada: { incluido: false, lados: [200], material: 'grisPerla' },
  pileta: null,
  adicionales: [],
  led: false,
  puertasVidrio: 0,
  cajones: TOPE_DE_GAMA.cajonesDefault,
  color: TOPE_DE_GAMA.colores[0],
}

export const metros = (largo: number) =>
  (largo / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const medidaLados = (lados: number[]) => `${lados.map(metros).join(' + ')} m`
const suma = (lados: number[]) => lados.reduce((acc, l) => acc + l, 0)

/** Medidas que acepta un lado de mesada de ese material (las fijas, o todas). */
export function medidasMesada(material: MesadaId): number[] | null {
  const medidas = MESADAS.find((m) => m.id === material)?.medidas
  return medidas ? Object.keys(medidas).map(Number) : null
}

/** El largo válido más cercano para un lado de mesada de ese material. */
export function ajustarAMesada(material: MesadaId, largo: number): number {
  const medidas = medidasMesada(material)
  if (!medidas) return largo
  return medidas.reduce((mejor, m) => (Math.abs(m - largo) < Math.abs(mejor - largo) ? m : mejor))
}

export const NOMBRE_MODULO: Record<ModuloId, string> = {
  bajoMesada: 'Bajo mesada',
  alacena: 'Alacena',
  mesada: 'Mesada',
}

/** Renglones y total. La mesada a consultar entra con nota y sin sumar. */
export function cotizar(s: Seleccion): {
  renglones: Renglon[]
  total: number
  aConsultar: boolean
} {
  const renglones: Renglon[] = []
  const tope = s.linea === 'topeDeGama'

  for (const id of ['bajoMesada', 'alacena'] as const) {
    const m = s[id]
    if (!m.incluido) continue
    renglones.push({
      nombre: NOMBRE_MODULO[id],
      medida: medidaLados(m.lados),
      // Cada lado se cotiza por separado: así una L sale igual que dos rectas.
      precio: m.lados.reduce((acc, largo) => acc + precioModulo(s.linea, id, largo), 0),
    })
  }

  let aConsultar = false
  if (s.mesada.incluido) {
    const material = MESADAS.find((m) => m.id === s.mesada.material)!
    const precios = s.mesada.lados.map((largo) => precioMesada(material.id, largo))
    const consultar = precios.some((p) => p === null)
    aConsultar = consultar
    renglones.push({
      nombre: `Mesada ${material.nombre}`,
      medida: medidaLados(s.mesada.lados),
      precio: consultar ? 0 : precios.reduce<number>((acc, p) => acc + (p ?? 0), 0),
      nota: consultar ? 'A consultar' : undefined,
    })
  }

  const pileta = PILETAS.find((p) => p.id === s.pileta)
  if (pileta)
    renglones.push({
      nombre: pileta.nombre,
      medida: '1 u.',
      precio: pileta.precio,
    })

  if (tope) {
    renglones.push({
      nombre: 'Color',
      medida: s.color,
      precio: 0,
      nota: 'Incluido',
    })
    if (s.bajoMesada.incluido) {
      const n = tiras(suma(s.bajoMesada.lados), TOPE_DE_GAMA.gola.metrosTira)
      renglones.push({
        nombre: 'Perfil Gola (apertura sin manijas)',
        medida: `${n} × ${TOPE_DE_GAMA.gola.metrosTira} m`,
        precio: n * TOPE_DE_GAMA.gola.precioTira,
      })
    }
    if (s.cajones > 0) {
      renglones.push({
        nombre: 'Correderas con cierre suave',
        medida: `${s.cajones} ${s.cajones === 1 ? 'cajón' : 'cajones'}`,
        precio: s.cajones * TOPE_DE_GAMA.precioCajon,
      })
    }
    if (s.alacena.incluido) {
      const n = tiras(suma(s.alacena.lados), TOPE_DE_GAMA.led.metrosTira)
      renglones.push({
        nombre: 'Luces LED en alacena',
        medida: `${n} × ${TOPE_DE_GAMA.led.metrosTira} m`,
        precio: n * TOPE_DE_GAMA.led.precioTira,
      })
    }
    renglones.push({
      nombre: 'Puerta vidriada con luz LED',
      medida: '1 u.',
      precio: 0,
      nota: 'Incluida',
    })
  }

  // En Tope de Gama el cubertero y el porta residuos vienen siempre.
  for (const a of ADICIONALES) {
    if (tope || s.adicionales.includes(a.id)) {
      renglones.push({ nombre: a.nombre, medida: '1 u.', precio: a.precio })
    }
  }

  if (!tope && s.led && s.alacena.incluido) {
    const n = tiras(suma(s.alacena.lados), EXTRAS.led.metrosTira)
    renglones.push({
      nombre: EXTRAS.led.nombre,
      medida: `${n} × ${EXTRAS.led.metrosTira} m`,
      precio: n * EXTRAS.led.precioTira,
    })
  }
  if (!tope && s.puertasVidrio > 0) {
    renglones.push({
      nombre: EXTRAS.puertaVidrio.nombre,
      medida: `${s.puertasVidrio} ${s.puertasVidrio === 1 ? 'puerta' : 'puertas'}`,
      precio: s.puertasVidrio * EXTRAS.puertaVidrio.precio,
    })
  }

  const total = renglones.reduce((acc, r) => acc + r.precio, 0)
  return { renglones, total, aConsultar }
}

// ── Validación del pedido que llega a /api/presupuesto ──────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function leerModulo(value: unknown): ModuloElegido | null {
  if (!isRecord(value) || typeof value.incluido !== 'boolean' || !Array.isArray(value.lados)) {
    return null
  }
  const lados = value.lados
  if (lados.length < 1 || lados.length > MAX_LADOS) return null
  for (const l of lados) {
    if (
      typeof l !== 'number' ||
      !Number.isInteger(l) ||
      l < LARGO_MIN ||
      l > LARGO_MAX ||
      l % LARGO_PASO !== 0
    ) {
      return null
    }
  }
  return { incluido: value.incluido, lados: lados as number[] }
}

/** La selección del navegador, validada. null si algo no cierra. */
export function leerSeleccion(value: unknown): Seleccion | null {
  if (!isRecord(value)) return null
  const linea = LINEA_IDS.find((l) => l === value.linea)
  if (!linea) return null

  const [bajoMesada, alacena, mesadaBase] = MODULO_IDS.map((id) => leerModulo(value[id]))
  if (!bajoMesada || !alacena || !mesadaBase || !isRecord(value.mesada)) return null
  const material = MESADAS.find((m) => m.id === (value.mesada as Record<string, unknown>).material)
  if (!material) return null
  if (material.medidas && mesadaBase.lados.some((l) => !(l in material.medidas!))) return null

  const pileta = value.pileta === null ? null : PILETAS.find((p) => p.id === value.pileta)?.id
  if (pileta === undefined) return null

  if (!Array.isArray(value.adicionales)) return null
  const adicionales = ADICIONALES.map((a) => a.id).filter((id) =>
    (value.adicionales as unknown[]).includes(id),
  )

  const cajones = value.cajones
  if (
    typeof cajones !== 'number' ||
    !Number.isInteger(cajones) ||
    cajones < 0 ||
    cajones > TOPE_DE_GAMA.cajonesMax
  ) {
    return null
  }
  // Opcionales nuevos: un navegador con la página vieja no los manda.
  const led = value.led === undefined ? false : value.led
  if (typeof led !== 'boolean') return null
  const puertasVidrio = value.puertasVidrio === undefined ? 0 : value.puertasVidrio
  if (
    typeof puertasVidrio !== 'number' ||
    !Number.isInteger(puertasVidrio) ||
    puertasVidrio < 0 ||
    puertasVidrio > EXTRAS.puertaVidrio.max
  ) {
    return null
  }

  const color = TOPE_DE_GAMA.colores.find((c) => c === value.color)
  if (!color) return null

  return {
    linea,
    bajoMesada,
    alacena,
    mesada: { ...mesadaBase, material: material.id },
    pileta,
    adicionales,
    led,
    puertasVidrio,
    cajones,
    color,
  }
}
