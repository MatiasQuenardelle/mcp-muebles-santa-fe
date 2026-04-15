// ============================================
// IMPORTANT: Update this with Marcelo's real WhatsApp number
// Format: country code + area code + number (no spaces, no dashes)
// Example: 5493424123456
// ============================================
const WHATSAPP_NUMBER = '5493424000000'

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hola, quiero consultar por una cocina a medida. ¿Me pueden pasar un presupuesto?'
)

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`
