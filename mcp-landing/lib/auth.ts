// Sesión del panel de admin: una sola contraseña compartida + cookie firmada.
// Usa solo Web Crypto, así que corre igual en el runtime Edge (middleware.ts)
// y en Node (route handlers). No importar nada de lib/db acá.

export const ADMIN_COOKIE = 'mcp_admin'
export const ADMIN_SESSION_DAYS = 60

function base64url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return base64url(new Uint8Array(signature))
}

function secret(): string | null {
  return (process.env.ADMIN_SESSION_SECRET ?? '').trim() || null
}

/** Token con forma `<expiraciónEnMs>.<firma>`. */
export async function createSessionToken(): Promise<string | null> {
  const key = secret()
  if (!key) {
    return null
  }
  const exp = String(Date.now() + ADMIN_SESSION_DAYS * 86_400_000)
  return `${exp}.${await hmac(exp, key)}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const key = secret()
  if (!key || !token) {
    return false
  }

  const dot = token.lastIndexOf('.')
  if (dot <= 0) {
    return false
  }

  const exp = token.slice(0, dot)
  const signature = token.slice(dot + 1)

  const expiresAt = Number(exp)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false
  }

  const expected = await hmac(exp, key)
  return timingSafeEqual(signature, expected)
}

// En Edge no existe crypto.timingSafeEqual. Comparar las firmas (no la
// contraseña) carácter a carácter en tiempo constante alcanza para no filtrar
// información por el tiempo de respuesta.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Compara la contraseña ingresada con ADMIN_PASSWORD sin filtrar el largo:
 * se comparan los HMAC, no los strings crudos.
 */
export async function checkPassword(candidate: string): Promise<boolean> {
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
  const key = secret()
  if (!expected || !key) {
    return false
  }
  return timingSafeEqual(await hmac(candidate, key), await hmac(expected, key))
}

export function isAdminConfigured(): boolean {
  return Boolean((process.env.ADMIN_PASSWORD ?? '').trim() && secret())
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) {
    return null
  }
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Re-verificación en cada route handler de /api/admin/*. El middleware solo no
 * alcanza: la familia next 14.2 tuvo un bypass de auth por middleware
 * (CVE-2025-29927) y el rango "^14.2.0" del package.json puede moverse.
 */
export async function requireAdmin(request: Request): Promise<boolean> {
  return verifySessionToken(readCookie(request, ADMIN_COOKIE))
}
