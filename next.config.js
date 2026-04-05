/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack completely to avoid memory issues
  experimental: {
    serverActions: {
      bodySizeLimit: 50 * 1024 * 1024, // 50MB limit for large file uploads
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
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "mongodb+srv://Sostene:sostene123@cluster0.16msskq.mongodb.net/VERTEX_DB?retryWrites=true&w=majority&appName=Cluster0",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "dzikttrya",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "3869218746286514",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "kP8sL7xT9k8yV8uH7fL4x",
  },
};

module.exports = nextConfig;
