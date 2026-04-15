import TopBar from '@/components/TopBar'
import Hero from '@/components/Hero'
import WhatIsIncluded from '@/components/WhatIsIncluded'
import UrgencyBanner from '@/components/UrgencyBanner'
import WhyMCP from '@/components/WhyMCP'
import HowItWorks from '@/components/HowItWorks'
import NoHassle from '@/components/NoHassle'
import Gallery from '@/components/Gallery'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import Location from '@/components/Location'
import FinalCTA from '@/components/FinalCTA'

export default function Home() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <WhatIsIncluded />
        <UrgencyBanner />
        <WhyMCP />
        <HowItWorks />
        <NoHassle />
        <Gallery />
        <Testimonials />
        <FAQ />
        <Location />
        <FinalCTA />
      </main>
      <footer className="bg-brand-dark border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-10 text-center">
          <div className="text-brand-muted-dark text-sm">
            &copy; 2026 MCP - Muebles a Medida &middot; Santa Fe, Argentina
          </div>
          <div className="text-brand-muted-dark/60 text-xs mt-2">
            Dise&ntilde;o e instalaci&oacute;n de cocinas a medida &middot; 20+ a&ntilde;os de experiencia
          </div>
        </div>
      </footer>
    </>
  )
}
