/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // `page.dev.tsx` routes (the hologram lab) exist under `next dev` only, so the export never ships them
  pageExtensions: process.env.NODE_ENV === 'production' ? ['tsx', 'ts', 'jsx', 'js'] : ['dev.tsx', 'tsx', 'ts', 'jsx', 'js'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  basePath: '/my-portfolio',
  assetPrefix: '/my-portfolio',
}

export default nextConfig
