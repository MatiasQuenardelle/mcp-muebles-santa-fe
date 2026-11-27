import type { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import Footer from '@/components/cocinas/Footer'
import Calculadora from '@/components/placares/Calculadora'
import { Cierre, Nav } from '@/components/placares/Cta'
import Hero from '@/components/placares/Hero'
import { Incluye, Preguntas, Proceso, Trabajos } from '@/components/placares/Secciones'
import { PREGUNTAS } from '@/components/placares/data'
import { SITE_URL } from '@/lib/constants'
import { breadcrumbJsonLd, businessJsonLd, faqPageJsonLd } from '@/lib/structuredData'

const TITULO = 'Placares a Medida en Santa Fe: precios y calculadora | MCP Muebles'
const DESCRIPCION =
  'Precios de placares a medida en Santa Fe, con calculadora online por metro cúbico. Interior a medida, puertas batientes o corredizas, melamina Egger y colocación propia.'

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  keywords:
    'placares a medida santa fe, placard a medida, precio placard, vestidores a medida santa fe, placard con puertas corredizas',
  alternates: { canonical: '/placares' },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    type: 'website',
    locale: 'es_AR',
    url: `${SITE_URL}/placares`,
    siteName: 'MCP - Muebles a Medida',
    images: [{ url: '/placares/hero.jpg', alt: 'Placard a medida fabricado por MCP en Santa Fe' }],
  },
}

export default function PlacaresPage() {
  return (
    <div className="font-body">
      <JsonLd
        data={[
          businessJsonLd,
          faqPageJsonLd(PREGUNTAS),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Placares a medida', path: '/placares' },
          ]),
        ]}
      />
      <Nav />
      <main>
        <Hero />
        <Calculadora />
        <Trabajos />
        <Incluye />
        <Proceso />
        <Preguntas />
        <Cierre />
      </main>
      <Footer
        nota="Precios de referencia en pesos argentinos. Los valores de la calculadora son orientativos: el precio final surge de medir el espacio y definir el interior."
        enlaces={[
          { texto: 'Calculadora', href: '#calculadora' },
          { texto: 'Trabajos', href: '#trabajos' },
          { texto: 'Qué incluye', href: '#incluye' },
          { texto: 'Preguntas frecuentes', href: '#preguntas' },
          { texto: 'Cocinas a medida', href: '/cocinas' },
        ]}
      />
    </div>
  )
}
