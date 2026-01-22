/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'standalone',

  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: { unoptimized: true },

  compiler: isProd ? { removeConsole: { exclude: ['error', 'warn'] } } : {},

  // ✅ было experimental.typedRoutes -> стало typedRoutes
  typedRoutes: true,

  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'framer-motion'],
  },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      { source: '/:path*', headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' }] },
    ];
  },

  httpAgentOptions: { keepAlive: true },
};

export default nextConfig;
