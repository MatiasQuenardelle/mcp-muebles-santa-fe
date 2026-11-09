// Navegación del panel: pensada para el celular. Cinco pestañas entran a 375 px; el
// detalle de cada una va en la fila de chips de abajo. Sin imports en runtime.

export type RolNav = 'owner' | 'user'

export interface ChipNav {
  href: string
  label: string
  // Otras rutas que también lo activan.
  prefijos?: string[]
  // Solo se activa en su ruta exacta (o en un prefijo adicional).
  exacto?: boolean
}

export interface GrupoNav {
  id: string
  label: string
  href: string
  exactos?: string[]
  prefijos: string[]
  chips: ChipNav[]
}

const CHIPS_VENTAS: ChipNav[] = [
  { href: '/admin', label: 'Contactos', exacto: true, prefijos: ['/admin/c', '/admin/nuevo'] },
  { href: '/admin/embudo', label: 'Embudo' },
  { href: '/admin/presupuestos', label: 'Presupuestos', prefijos: ['/admin/presupuesto'] },
  { href: '/admin/whatsapp', label: 'Clics WA' },
]

const PREFIJOS_VENTAS = [
  '/admin/c',
  '/admin/nuevo',
  '/admin/embudo',
  '/admin/whatsapp',
  '/admin/presupuesto',
  '/admin/presupuestos',
]

export const ACCESOS_MAS: (ChipNav & { detalle: string })[] = [
  { href: '/admin/compras', label: 'Compras', detalle: 'Pedidos, mercadería recibida y facturas' },
  { href: '/admin/compras/proveedores', label: 'Proveedores', detalle: 'Cuánto se le debe a cada uno y pagos' },
  { href: '/admin/equipo', label: 'Equipo', detalle: 'Personal, ventas y rendimiento' },
  { href: '/admin/equipo/tareas', label: 'Tareas', detalle: 'Qué tiene que hacer cada persona' },
  { href: '/admin/equipo/comisiones', label: 'Comisiones', detalle: 'Generadas, pagadas y pendientes' },
  { href: '/admin/empresa', label: 'Empresa', detalle: 'Datos importantes de MCP' },
  { href: '/admin/usuarios', label: 'Usuarios', detalle: 'Quién entra al panel' },
]

const GRUPOS_DUENO: GrupoNav[] = [
  { id: 'inicio', label: 'Inicio', href: '/admin/inicio', prefijos: ['/admin/inicio'], chips: [] },
  { id: 'ventas', label: 'Ventas', href: '/admin', exactos: ['/admin'], prefijos: PREFIJOS_VENTAS, chips: CHIPS_VENTAS },
  {
    id: 'obras',
    label: 'Obras',
    href: '/admin/obras',
    prefijos: ['/admin/obras'],
    chips: [
      { href: '/admin/obras', label: 'En curso' },
      { href: '/admin/obras/cobros', label: 'Cobros' },
    ],
  },
  {
    id: 'plata',
    label: 'Plata',
    href: '/admin/caja',
    prefijos: ['/admin/caja'],
    chips: [
      { href: '/admin/caja', label: 'Movimientos', exacto: true },
      { href: '/admin/caja/cuentas', label: 'Cuentas' },
      { href: '/admin/caja/fijos', label: 'Gastos fijos' },
      { href: '/admin/caja/ganancia', label: 'Ganancia' },
    ],
  },
  {
    id: 'mas',
    label: 'Más',
    href: '/admin/mas',
    prefijos: ['/admin/mas', '/admin/compras', '/admin/equipo', '/admin/empresa', '/admin/usuarios', '/admin/asistente'],
    chips: ACCESOS_MAS.map(({ href, label }) => ({ href, label })),
  },
]

const GRUPOS_EMPLEADO: GrupoNav[] = [
  { id: 'inicio', label: 'Inicio', href: '/admin/inicio', prefijos: ['/admin/inicio'], chips: [] },
  {
    id: 'ventas',
    label: 'Ventas',
    href: '/admin',
    exactos: ['/admin'],
    prefijos: PREFIJOS_VENTAS,
    chips: CHIPS_VENTAS.filter((chip) => chip.href !== '/admin/presupuestos'),
  },
  { id: 'obras', label: 'Obras', href: '/admin/obras', prefijos: ['/admin/obras'], chips: [] },
  { id: 'tareas', label: 'Tareas', href: '/admin/equipo/tareas', prefijos: ['/admin/equipo/tareas'], chips: [] },
]

// Con límite de segmento: '/admin/c' no tiene que activarse en '/admin/caja'.
function coincide(ruta: string, prefijo: string): boolean {
  return ruta === prefijo || ruta.startsWith(`${prefijo}/`)
}

function largoCoincidencia(ruta: string, chip: ChipNav): number {
  const propio = chip.exacto ? (ruta === chip.href ? chip.href.length : 0) : coincide(ruta, chip.href) ? chip.href.length : 0
  const extra = (chip.prefijos ?? []).reduce(
    (mayor, prefijo) => (coincide(ruta, prefijo) ? Math.max(mayor, prefijo.length) : mayor),
    0
  )
  return Math.max(propio, extra)
}

export function gruposPara(rol: RolNav): GrupoNav[] {
  return rol === 'owner' ? GRUPOS_DUENO : GRUPOS_EMPLEADO
}

export function navActiva(ruta: string, rol: RolNav): { grupo: GrupoNav | null; chip: ChipNav | null } {
  const grupo =
    gruposPara(rol).find(
      (candidato) =>
        (candidato.exactos ?? []).includes(ruta) || candidato.prefijos.some((prefijo) => coincide(ruta, prefijo))
    ) ?? null
  if (!grupo) {
    return { grupo: null, chip: null }
  }
  // El más específico gana: /admin/obras/cobros activa Cobros y no En curso.
  let chip: ChipNav | null = null
  let mejor = 0
  for (const candidato of grupo.chips) {
    const largo = largoCoincidencia(ruta, candidato)
    if (largo > mejor) {
      mejor = largo
      chip = candidato
    }
  }
  return { grupo, chip }
}
