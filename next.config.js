/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
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
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "depwopvo1",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "748922292817581",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "HtNpOdQGT-kfTIWQ811PQx0mqW4",
  },
  // Add webpack configuration to handle CSS processing
  webpack: (config, { dev, isServer }) => {
    // Fix CSS processing issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
