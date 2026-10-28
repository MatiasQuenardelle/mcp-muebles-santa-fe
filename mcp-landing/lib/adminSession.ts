// Equivalente a requireAdmin() para server components, que no reciben un Request.
// Vive aparte de lib/auth para no arrastrar `next/headers` al bundle Edge del
// middleware, que importa lib/auth y no puede usar esa API.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { ADMIN_COOKIE } from '@/lib/auth'
import { userFromCookie, type AdminUser } from '@/lib/session'

// cache(): la página y la cabecera la piden en el mismo render; una sola query.
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  return userFromCookie(cookies().get(ADMIN_COOKIE)?.value)
})

// Mismo motivo que requireAdmin en los route handlers: el middleware por sí solo
// no alcanza (CVE-2025-29927), y estas páginas muestran datos de los clientes.
export async function requireAdminPage(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}

export async function requireOwnerPage(): Promise<AdminUser> {
  const user = await requireAdminPage()
  if (user.role !== 'owner') {
    redirect('/admin/inicio')
  }
  return user
}
