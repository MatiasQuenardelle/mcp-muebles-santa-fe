import { SITE_URL } from '@/lib/constants'
import type { Faq } from '@/lib/faqData'

const BUSINESS_ID = `${SITE_URL}/#business`

const MAPS_LINK =
  'https://www.google.com/maps/place/MCP+Muebles+%E2%80%93+Fabrica+de+muebles+de+cocinas/@-31.6104287,-60.6902168,17z/data=!3m1!4b1!4m6!3m5!1s0x95b507c7c6fac5c9:0x514cab0ca3f96398!8m2!3d-31.6104287!4d-60.6902168!16s%2Fg%2F11yhknrj08'

export const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  '@id': BUSINESS_ID,
  name: 'MCP - Muebles a Medida',
  alternateName: 'MCP Muebles \u2013 F\u00e1brica de muebles de cocinas',
  description:
    'F\u00e1brica de cocinas a medida en Santa Fe con instalaci\u00f3n completa. Melamina EGGER, mesadas de granito natural, herrajes Grupo Euro y bacha Johnson. 20 a\u00f1os de experiencia.',
  url: `${SITE_URL}/`,
  telephone: '+5493425196295',
  image: `${SITE_URL}/logo.jpg`,
  logo: `${SITE_URL}/logo.jpg`,
  priceRange: '$$',
  currenciesAccepted: 'ARS',
  paymentAccepted: 'Efectivo, Transferencia',
  areaServed: { '@type': 'City', name: 'Santa Fe' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Santa Fe',
    addressRegion: 'Santa Fe',
    addressCountry: 'AR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -31.6104287,
    longitude: -60.6902168,
  },
  hasMap: MAPS_LINK,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
  ],
}

export const cocinaProductJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cocina a medida',
  description:
    'Cocina a medida llave en mano en Santa Fe: bajo mesada, mesada de granito natural y bacha Johnson instalada. Melamina EGGER y herrajes Grupo Euro.',
  image: [`${SITE_URL}/cocina-premium.png`, `${SITE_URL}/cocina-moderna.png`],
  brand: { '@type': 'Brand', name: 'MCP - Muebles a Medida' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'ARS',
    price: '660000',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/`,
    seller: { '@id': BUSINESS_ID },
  },
}

export function faqPageJsonLd(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
