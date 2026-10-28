// pdfkit (dentro de @react-pdf/renderer) carga las fuentes estándar con un
// require dinámico ('#standard-fonts/Helvetica') que el trazado de Next no ve:
// sin esto, en Vercel las rutas de PDF fallan con "Cannot find module".
const PDF_FONTS = ['./node_modules/pdfkit/js/standard-fonts/**']

/** @type {import('next').NextConfig} */
const nextConfig = {
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
