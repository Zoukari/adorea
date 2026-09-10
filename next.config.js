/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Next 15 — React 19 compatible
  experimental: {
    reactCompiler: false,
  },
}

module.exports = nextConfig
