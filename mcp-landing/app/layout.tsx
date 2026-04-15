import type { Metadata } from 'next'
import { Inter, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cocinas a Medida en Santa Fe | MCP - Muebles a Medida - Presupuesto Gratis',
  description:
    'Cocinas a medida con instalación completa en Santa Fe. Melamina EGGER, granito natural, bacha Johnson incluida. Desde $660.000. Presupuesto gratis por WhatsApp. 20 años de experiencia.',
  keywords:
    'cocinas a medida santa fe, muebles de cocina, amoblamientos de cocina, bajo mesada, cocinas integrales, muebles a medida santa fe',
  openGraph: {
    title: 'Cocinas a Medida en Santa Fe | MCP - Muebles a Medida',
    description:
      'Tu cocina a medida, instalada y funcionando. Todo incluido desde $660.000. Presupuesto gratis.',
    type: 'website',
    locale: 'es_AR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${dmSerif.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
