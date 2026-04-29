import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'cdn-images-1.medium.com' },
      { protocol: 'https', hostname: 'miro.medium.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  // Don't bundle firebase-admin in client bundle
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
