import { ogImageContentType, ogImageSize, renderOgImage } from '@/lib/ogImage'

export const alt = 'MCP - Cocinas a Medida en Santa Fe'
export const size = ogImageSize
export const contentType = ogImageContentType

export default function OpengraphImage() {
  return renderOgImage({
    heading: 'Cocinas a medida en Santa Fe',
    highlight: 'Instaladas y funcionando · Desde $660.000',
    footer: '20 años de experiencia · Presupuesto gratis por WhatsApp',
  })
}
