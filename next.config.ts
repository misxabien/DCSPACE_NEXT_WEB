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
      // Local routes under app/api/user/* (events, profile, health) are served by Next.js first.
      {
        source: '/api/user/auth/send-verification',
        destination: '/api/user/auth/send-verification',
      },
      {
        source: '/api/user/auth/register',
        destination: '/api/user/auth/register',
      },
      {
        source: '/api/user/auth/login',
        destination: '/api/user/auth/login',
      },
      {
        source: '/api/user/health',
        destination: '/api/user/health',
      },
      {
        source: '/api/user/events',
        destination: '/api/user/events',
      },
      {
        source: '/api/user/profile',
        destination: '/api/user/profile',
      },
      {
        source: '/api/user/registrations',
        destination: '/api/user/registrations',
      },
      {
        source: '/api/user/attendance',
        destination: '/api/user/attendance',
      },
      {
        source: '/api/user/notifications',
        destination: '/api/user/notifications',
      },
      {
        source: '/api/user/feedback',
        destination: '/api/user/feedback',
      },
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
