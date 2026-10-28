/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // react-pdf trae fontkit/yoga con assets propios: se carga desde node_modules
    // en vez de pasar por el bundler de las rutas.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}

export default nextConfig
