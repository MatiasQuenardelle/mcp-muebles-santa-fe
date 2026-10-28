// Server-only (Node): verificación en dos pasos con códigos TOTP (RFC 6238),
// los de Google Authenticator / 1Password / Authy. Sin dependencias: es un
// HMAC-SHA1 sobre el número de ventana de 30 segundos.

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP_SECONDS = 30
const ISSUER = 'MCP Muebles'

function base32Encode(bytes: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32[(value << (5 - bits)) & 31]
  }
  return output
}

function base32Decode(text: string): Buffer {
  let bits = 0
  let value = 0
  const output: number[] = []
  const clean = text.replace(/=+$/, '').toUpperCase()
  for (let i = 0; i < clean.length; i += 1) {
    const index = BASE32.indexOf(clean[i])
    if (index === -1) {
      continue
    }
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

function codeAt(secret: string, counter: number): string {
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac('sha1', base32Decode(secret)).update(message).digest()
  const offset = digest[digest.length - 1] & 15
  const binary = digest.readUInt32BE(offset) & 0x7fffffff
  return String(binary % 1_000_000).padStart(6, '0')
}

/** Acepta la ventana actual y la anterior/siguiente, por relojes un poco corridos. */
export function verifyTotp(secret: string, code: string): boolean {
  const clean = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) {
    return false
  }
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS)
  return [-1, 0, 1].some((drift) => codeAt(secret, counter + drift) === clean)
}

export function totpUri(secret: string, email: string): string {
  const label = encodeURIComponent(`${ISSUER}:${email}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`
}

// El secreto se guarda cifrado: con la base sola no se pueden generar códigos.
// La clave sale de ADMIN_SESSION_SECRET, que vive solo en Vercel.
function key(): Buffer {
  const secret = (process.env.ADMIN_SESSION_SECRET ?? '').trim()
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET no está configurada')
  }
  return createHash('sha256').update(`totp:${secret}`).digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.')
}

export function decryptSecret(stored: string): string {
  const [iv, tag, encrypted] = stored.split('.').map((part) => Buffer.from(part, 'base64'))
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
