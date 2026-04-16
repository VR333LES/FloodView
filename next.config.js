/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/FloodView',
  assetPrefix: '/FloodView/',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
