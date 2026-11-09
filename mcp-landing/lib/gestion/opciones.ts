// Los desplegables de los formularios de plata.

import { db } from '@/lib/db'
import type { OpcionesMovimiento } from './tipos'

export async function opcionesMovimiento(): Promise<OpcionesMovimiento> {
  const sql = db()
  const [cuentas, categorias, obras, proveedores, personal] = await Promise.all([
    sql`select id, nombre from cuentas where activa order by created_at, nombre`,
    sql`select id, nombre, grupo, clave from categorias where activa order by grupo, nombre`,
    // Las canceladas también: se les pueden devolver señas.
    sql`select id, numero, titulo, cliente from obras order by entregada_en is not null, created_at desc limit 300`,
    sql`select id, nombre from proveedores where activo order by nombre`,
    sql`select id, nombre from personal where activo order by nombre`,
  ])
  return {
    cuentas: cuentas as unknown as OpcionesMovimiento['cuentas'],
    categorias: categorias as unknown as OpcionesMovimiento['categorias'],
    obras: obras as unknown as OpcionesMovimiento['obras'],
    proveedores: proveedores as unknown as OpcionesMovimiento['proveedores'],
    personal: personal as unknown as OpcionesMovimiento['personal'],
  }
}
