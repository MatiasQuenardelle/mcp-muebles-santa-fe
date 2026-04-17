const DEFAULT_WHATSAPP_NUMBER = '5493425696876'

const configuredWhatsAppNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')

export const WHATSAPP_NUMBER = configuredWhatsAppNumber || DEFAULT_WHATSAPP_NUMBER
export const HAS_CONFIGURED_WHATSAPP_NUMBER = configuredWhatsAppNumber.length > 0
export const WHATSAPP_DISPLAY_NUMBER = formatWhatsAppDisplay(WHATSAPP_NUMBER)

export const BASE_PRICE_LABEL = 'Desde $660.000 todo incluido'
export const WHATSAPP_DEFAULT_MESSAGE =
  'Hola Marcelo, quiero consultar por una cocina a medida. ¿Me podés pasar un presupuesto?'

export const GOOGLE_TAG_ID = (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? '').trim()
export const GOOGLE_ADS_ID = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '').trim()
export const GOOGLE_ADS_SEND_TO = (process.env.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO ?? '').trim()

interface WhatsAppUrlOptions {
  baseMessage?: string
  pagePath?: string
  queryString?: string
}

function formatWhatsAppDisplay(phone: string) {
  if (!phone) {
    return ''
  }

  if (phone.length === 13 && phone.startsWith('549')) {
    const country = '+54'
    const mobile = '9'
    const area = phone.slice(3, 6)
    const firstBlock = phone.slice(6, 10)
    const secondBlock = phone.slice(10, 13)

    return `${country} ${mobile} ${area} ${firstBlock}-${secondBlock}`
  }

  return `+${phone}`
}

export function buildWhatsAppUrl({
  baseMessage = WHATSAPP_DEFAULT_MESSAGE,
  pagePath,
  queryString,
}: WhatsAppUrlOptions = {}) {
  if (!WHATSAPP_NUMBER) {
    return '#contacto-mcp'
  }

  const normalizedPath = pagePath && pagePath !== '/' ? pagePath : ''
  const normalizedQuery = queryString ? `?${queryString}` : ''
  const attributionLine =
    normalizedPath || normalizedQuery
      ? `Referencia web: ${normalizedPath || '/'}${normalizedQuery}`
      : ''

  const text = [baseMessage, attributionLine].filter(Boolean).join('\n\n')

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
