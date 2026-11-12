// pdfkit (dentro de @react-pdf/renderer) carga las fuentes estándar con un
// require dinámico ('#standard-fonts/Helvetica') que el trazado de Next no ve:
// sin esto, en Vercel las rutas de PDF fallan con "Cannot find module".
const PDF_FONTS = ['./node_modules/pdfkit/js/standard-fonts/**']

// URLs de las landings viejas (antes de este sitio) que pueden seguir en anuncios
// de Google Ads, en Google o en links compartidos. Sin esto caen en un 404 que no
// carga GA4: el click se paga y la visita no queda en ningún lado. Next conserva
// el query string al redirigir, así que el gclid de Ads llega intacto.
// La de la ñ va en las dos formas porque puede llegar codificada o no.
const OLD_LANDINGS = [
  ['/diseño-de-cocinas-y-placares', '/'],
  ['/dise%C3%B1o-de-cocinas-y-placares', '/'],
  ['/diseno-de-cocinas-y-placares', '/'],
  ['/cocinas-a-medida', '/cocinas'],
  ['/cocina-240', '/cocinas'],
  ['/presupuesto', '/'],
  ['/placards', '/'],
  ['/placares', '/'],
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return OLD_LANDINGS.map(([source, destination]) => ({ source, destination, permanent: true }))
  },
  experimental: {
    // react-pdf trae fontkit/yoga con assets propios: se carga desde node_modules
    // en vez de pasar por el bundler de las rutas.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    outputFileTracingIncludes: {
      '/api/presupuesto/[id]/pdf': PDF_FONTS,
      '/api/admin/presupuestos/[id]/pdf': PDF_FONTS,
    },
  },
}

export default nextConfig
