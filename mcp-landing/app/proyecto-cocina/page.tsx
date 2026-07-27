import type { Metadata } from 'next'
import TopBar from '@/components/TopBar'
import ProyectoHero from '@/components/proyecto/ProyectoHero'
import GuiaCompra from '@/components/proyecto/GuiaCompra'
import ProyectoGaleria from '@/components/proyecto/ProyectoGaleria'
import PreciosReferencia from '@/components/proyecto/PreciosReferencia'
import ProyectoFAQ from '@/components/proyecto/ProyectoFAQ'
import ProyectoCTA from '@/components/proyecto/ProyectoCTA'
import ChatWidget from '@/components/proyecto/ChatWidget'
import JsonLd from '@/components/JsonLd'
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/structuredData'
import { proyectoFaqs } from '@/lib/faqData'

export const metadata: Metadata = {
  title: 'Proyecto Cocina: Guía y Precios de Cocinas a Medida en Santa Fe | MCP',
  description:
    'Guía de compra completa para tu cocina a medida en Santa Fe: cómo trabajamos, materiales (melamina Egger, herrajes Grupo Euro), precios de referencia por metro lineal, mesadas de granito instaladas y preguntas frecuentes.',
  alternates: { canonical: '/proyecto-cocina' },
  openGraph: {
    title: 'Proyecto Cocina: Guía y Precios de Cocinas a Medida en Santa Fe | MCP',
    description:
      'Todo lo que tenés que saber antes de encargar tu cocina a medida: proceso, materiales, precios de referencia y respuestas sin vueltas.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function ProyectoCocina() {
  return (
    <>
      <JsonLd
        data={[
          faqPageJsonLd(proyectoFaqs),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Proyecto Cocina', path: '/proyecto-cocina' },
          ]),
        ]}
      />
      <TopBar />
      <main>
        <ProyectoHero />
        <GuiaCompra />
        <ProyectoGaleria />
        <PreciosReferencia />
        <ProyectoFAQ />
        <ProyectoCTA />
      </main>
      <ChatWidget />
      <footer className="bg-brand-dark border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-10 text-center">
          <div className="text-brand-muted-dark text-sm">
            &copy; 2026 MCP - Muebles a Medida &middot; Santa Fe, Argentina
          </div>
          <div className="text-brand-muted-dark/60 text-xs mt-2">
            Los precios son orientativos y pueden variar seg&uacute;n el proyecto.
            Ped&iacute; tu presupuesto exacto.
          </div>
        </div>
      </footer>
    </>
  )
}
