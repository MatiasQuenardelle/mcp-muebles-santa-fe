import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/auth'

// Primera barrera del panel. Los route handlers de /api/admin/* igual
// re-verifican con requireAdmin(): el middleware solo no es suficiente.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // El login y su endpoint tienen que ser accesibles sin sesión.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const isValid = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)
  if (isValid) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const login = new URL('/admin/login', request.url)
  if (pathname !== '/admin') {
    login.searchParams.set('next', pathname)
  }
  return NextResponse.redirect(login)
}

export const config = {
  // Tiene que ser un literal estático: Next lo lee en tiempo de build.
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
