import type { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import Calculadora from '@/components/cocinas/Calculadora'
import Cierre from '@/components/cocinas/Cierre'
import Editorial from '@/components/cocinas/Editorial'
import Footer from '@/components/cocinas/Footer'
import Hero from '@/components/cocinas/Hero'
import Lineas from '@/components/cocinas/Lineas'
import Mesadas from '@/components/cocinas/Mesadas'
import Nav from '@/components/cocinas/Nav'
import Opiniones from '@/components/cocinas/Opiniones'
import PorQue from '@/components/cocinas/PorQue'
import Preguntas from '@/components/cocinas/Preguntas'
import Proceso from '@/components/cocinas/Proceso'
import Trabajos from '@/components/cocinas/Trabajos'
import { PREGUNTAS } from '@/components/cocinas/data'
import { SITE_URL } from '@/lib/constants'
import { breadcrumbJsonLd, businessJsonLd, faqPageJsonLd } from '@/lib/structuredData'

const TITULO = 'Cocinas a Medida en Santa Fe: precios y calculadora | MCP Muebles'
const DESCRIPCION =
  'Precios de cocinas a medida en Santa Fe, con calculadora online. Tres líneas (Económica, Estándar y Premium), mesadas de granito y sintético, colocación propia y garantía escrita de 12 meses.'

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  keywords:
    'cocinas a medida santa fe, precio cocina a medida, muebles de cocina santa fe, bajo mesada, alacena, mesada de granito, calculadora de precios cocina',
  alternates: { canonical: '/cocinas' },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    type: 'website',
    locale: 'es_AR',
    url: `${SITE_URL}/cocinas`,
    siteName: 'MCP - Muebles a Medida',
    images: [
      {
        url: '/cocinas/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Cocina a medida fabricada por MCP en Santa Fe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: ['/cocinas/og.jpg'],
  },
}

// Precios de la lista vigente: el más bajo es una alacena de 1.20 m en línea
// Económica (con el descuento) y el más alto un bajo mesada de 2.00 m Premium.
const productoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cocina a medida en Santa Fe',
  description:
    'Muebles de cocina a medida fabricados y colocados en Santa Fe: bajo mesada, alacena y mesada en tres líneas, con MDF y melamina Egger y herrajes Grupo Euro.',
  image: [`${SITE_URL}/cocinas/g-oscura.jpg`, `${SITE_URL}/cocinas/g-moderna.jpg`],
  brand: { '@type': 'Brand', name: 'MCP - Muebles a Medida' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'ARS',
    lowPrice: '222479',
    highPrice: '697324',
    offerCount: 30,
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/cocinas`,
    seller: { '@id': `${SITE_URL}/#business` },
  },
}

export default function CocinasPage() {
  return (
    <div className="font-body">
      <JsonLd
        data={[
          businessJsonLd,
          productoJsonLd,
          faqPageJsonLd(PREGUNTAS),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Cocinas a medida', path: '/cocinas' },
          ]),
        ]}
      />
      <Nav />
      <main>
        <Hero />
        <Lineas />
        <Calculadora />
        <Trabajos />
        <Mesadas />
        <Proceso />
        <PorQue />
        <Opiniones />
        <Editorial />
        <Preguntas />
        <Cierre />
      </main>
      <Footer />
    </div>
  )
}
