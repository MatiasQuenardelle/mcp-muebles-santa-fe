// WhatsApp identifica a un celular argentino como 549 + área + número, y en el CRM
// el mismo número aparece como "342 569-6876" o "0342 15 569-6876". Se comparan
// en una forma común: los 10 dígitos nacionales.

export function telefonoCanonico(raw: string | null | undefined): string | null {
  let digits = (raw ?? '').replace(/\D/g, '')
  if (!digits) {
    return null
  }

  digits = digits.replace(/^00/, '')
  const internacional = digits.startsWith('54') && digits.length >= 12
  if (internacional) {
    digits = digits.slice(2)
    if (digits.startsWith('9') && digits.length === 11) {
      digits = digits.slice(1)
    }
  }
  digits = digits.replace(/^0/, '')

  // El "15" va después del área, que tiene entre 2 y 4 dígitos.
  if (digits.length === 12) {
    for (const area of [2, 3, 4]) {
      if (digits.slice(area, area + 2) === '15') {
        return digits.slice(0, area) + digits.slice(area + 2)
      }
    }
  }

  return digits
}

export function mismoTelefono(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = telefonoCanonico(a)
  return left !== null && left === telefonoCanonico(b)
}
