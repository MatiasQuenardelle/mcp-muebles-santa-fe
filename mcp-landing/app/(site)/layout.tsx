import type { Metadata } from 'next'
import Script from 'next/script'
import { CLARITY_ID, GOOGLE_ADS_ID, GOOGLE_TAG_ID, SITE_URL } from '@/lib/constants'
import AttributionTracker from '@/components/AttributionTracker'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Cocinas a Medida en Santa Fe | MCP - Muebles a Medida - Presupuesto Gratis',
  description:
    'Cocinas a medida con instalación completa en Santa Fe. Melamina EGGER, granito natural, bacha Johnson incluida. Desde $660.000. Presupuesto gratis por WhatsApp. 20 años de experiencia.',
  keywords:
    'cocinas a medida santa fe, muebles de cocina, amoblamientos de cocina, bajo mesada, cocinas integrales, muebles a medida santa fe',
  alternates: { canonical: '/' },
  icons: { apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Cocinas a Medida en Santa Fe | MCP - Muebles a Medida',
    description:
      'Tu cocina a medida, instalada y funcionando. Todo incluido desde $660.000. Presupuesto gratis.',
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: 'MCP - Muebles a Medida',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cocinas a Medida en Santa Fe | MCP - Muebles a Medida',
    description:
      'Tu cocina a medida, instalada y funcionando. Todo incluido desde $660.000. Presupuesto gratis.',
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const primaryGoogleTagId = GOOGLE_TAG_ID || GOOGLE_ADS_ID
  const tagConfigs = Array.from(new Set([GOOGLE_TAG_ID, GOOGLE_ADS_ID].filter(Boolean)))

  return (
    <>
      {primaryGoogleTagId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${primaryGoogleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              ${tagConfigs.map((id) => `gtag('config', '${id}');`).join('\n')}
            `}
          </Script>
        </>
      ) : null}
      {CLARITY_ID ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      ) : null}
      <AttributionTracker />
      {children}
      <ChatWidget />
    </>
  )
}
