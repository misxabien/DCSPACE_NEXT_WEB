import type { NextConfig } from 'next';

const backendUserUrl = process.env.BACKEND_USER_URL || 'http://127.0.0.1:4001';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/user/auth/:path*',
        destination: `${backendUserUrl}/api/auth/:path*`,
      },
      {
        source: '/api/user/:path*',
        destination: `${backendUserUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
