import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, readSessionCookie } from '@/lib/auth'

// Lo que tiene que andar sin sesión: el login, y el link de invitación con el
// que alguien elige su contraseña por primera vez.
const PUBLIC_PATHS = ['/admin/login', '/admin/invitacion', '/api/admin/login', '/api/admin/invite']

// Primera barrera del panel: descarta cookies que no firmamos nosotros. Los
// route handlers y las páginas igual re-verifican contra la base (lib/session.ts):
// el middleware no sabe si la sesión se cerró o si el usuario se dio de baja.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) {
    return withSecurityHeaders(NextResponse.next())
  }

  if (await readSessionCookie(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return withSecurityHeaders(NextResponse.next())
  }

  if (pathname.startsWith('/api/')) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado.' }, { status: 401 }))
  }

  const login = new URL('/admin/login', request.url)
  if (pathname !== '/admin') {
    login.searchParams.set('next', pathname + request.nextUrl.search)
  }
  return NextResponse.redirect(login)
}

// El panel no se puede embeber en otro sitio (clickjacking), no se cachea en
// proxies ni en el navegador, y no le pasa la URL a nadie por el Referer.
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'")
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  // Tiene que ser un literal estático: Next lo lee en tiempo de build.
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
