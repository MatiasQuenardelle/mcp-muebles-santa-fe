import { ogImageContentType, ogImageSize, renderOgImage } from '@/lib/ogImage'

export const alt = 'Proyecto Cocina: guía y precios de cocinas a medida en Santa Fe'
export const size = ogImageSize
export const contentType = ogImageContentType

export default function OpengraphImage() {
  return renderOgImage({
    heading: 'Proyecto Cocina: guía y precios',
    highlight: 'Materiales, proceso y precios de referencia',
    footer: 'Cocinas a medida en Santa Fe · Presupuesto gratis',
  })
}
