// Cookie de sesión del panel. Usa solo Web Crypto, así que corre igual en el
// runtime Edge (middleware.ts) y en Node (route handlers). No importar nada de
// lib/db acá: la validación contra la base (sesión revocada, usuario dado de
// baja) vive en lib/session.ts.

export const ADMIN_COOKIE = 'mcp_admin'
export const ADMIN_SESSION_DAYS = 30

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

export function randomToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)))
}

export async function sha256Base64url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return base64url(new Uint8Array(digest))
}

/**
 * Cookie con forma `<sesión>.<expiraciónEnMs>.<firma>`. La sesión es un token
 * al azar cuyo hash está en admin_sessions; la firma deja que el middleware
 * descarte cookies inventadas sin ir a la base.
 */
export async function signSessionCookie(
  sessionToken: string,
  expiresAt: number
): Promise<string | null> {
  const key = secret()
  if (!key) {
    return null
  }
  const payload = `${sessionToken}.${expiresAt}`
  return `${payload}.${await hmac(payload, key)}`
}

/** Devuelve el token de sesión si la cookie está bien firmada y no venció. */
export async function readSessionCookie(cookie: string | undefined | null): Promise<string | null> {
  const key = secret()
  if (!key || !cookie) {
    return null
  }
  const parts = cookie.split('.')
  if (parts.length !== 3) {
    return null
  }
  const [sessionToken, exp, signature] = parts
  const expiresAt = Number(exp)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null
  }
  const expected = await hmac(`${sessionToken}.${exp}`, key)
  return timingSafeEqual(signature, expected) ? sessionToken : null
}

// En Edge no existe crypto.timingSafeEqual. Comparar las firmas carácter a
// carácter en tiempo constante alcanza para no filtrar información por el
// tiempo de respuesta.
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

export function isAdminConfigured(): boolean {
  return Boolean(secret())
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) {
    return null
  }
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
