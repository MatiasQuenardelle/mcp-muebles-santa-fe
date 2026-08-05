// Equivalente a requireAdmin() para server components, que no reciben un Request.
// Vive aparte de lib/auth para no arrastrar `next/headers` al bundle Edge del
// middleware, que importa lib/auth y no puede usar esa API.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/auth'

// Mismo motivo que requireAdmin en los route handlers: el middleware por sí solo
// no alcanza (CVE-2025-29927), y estas páginas muestran datos de los clientes.
export async function requireAdminPage(): Promise<void> {
  if (!(await verifySessionToken(cookies().get(ADMIN_COOKIE)?.value))) {
    redirect('/admin/login')
  }
}
