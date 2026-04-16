/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/FloodView',
  assetPrefix: '/FloodView/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
