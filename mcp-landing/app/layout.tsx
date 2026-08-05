import type { Metadata } from 'next'
import { Inter, DM_Serif_Display } from 'next/font/google'
import { SITE_URL } from '@/lib/constants'
import './globals.css'

// Layout raíz mínimo: solo html/body y tipografías. El marketing (GA, Ads,
// Clarity, atribución, metadata pública) vive en app/(site)/layout.tsx, para
// que el panel de admin no dispare eventos ni se pise su propia cookie de
// atribución cada vez que Marcelo lo abre.

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
  metadataBase: new URL(SITE_URL),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${dmSerif.variable} font-sans`}>{children}</body>
    </html>
  )
}
