// Server-only (Node): hash de contraseñas del panel con scrypt.
// scrypt y no SHA-256: es lento y gasta memoria a propósito, así que probar
// contraseñas contra un volcado de la base cuesta caro.

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// N=2^15, r=8: ~32 MB y ~100 ms por hash. Entra holgado en una función de Vercel.
const PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const KEY_LENGTH = 64

export const MIN_PASSWORD_LENGTH = 10

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  })
}

/** Formato: `scrypt$N$r$p$<sal base64>$<hash base64>`, para poder subir los parámetros más adelante. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS)
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const parts = (stored ?? '').split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    // Igual se gasta un hash, para que "usuario sin contraseña" no responda más
    // rápido que "contraseña incorrecta".
    await derive(password, randomBytes(16), PARAMS)
    return false
  }
  const [, n, r, p, salt, hash] = parts
  const expected = Buffer.from(hash, 'base64')
  const key = await derive(password, Buffer.from(salt, 'base64'), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMS.maxmem,
  })
  return key.length === expected.length && timingSafeEqual(key, expected)
}

// Lo mínimo razonable sin molestar: largo, y que no sea una de las obvias.
const COMMON = ['1234567890', 'contraseña', 'password12', 'qwertyuiop', 'mcpmuebles']

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (password.length > 200) {
    return 'La contraseña es demasiado larga.'
  }
  const lower = password.toLowerCase()
  if (COMMON.some((common) => lower.includes(common)) || /^(.)\1+$/.test(password)) {
    return 'Esa contraseña es muy fácil de adivinar. Probá con una frase.'
  }
  return null
}
