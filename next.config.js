/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/FloodView',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
