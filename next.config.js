/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: 10 * 1024 * 1024, // 10MB limit for large file uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    enabled: false, // Disable Turbopack to avoid memory issues
  },
};

module.exports = nextConfig;
