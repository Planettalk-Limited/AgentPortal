const withNextIntl = require('next-intl/plugin')(
  './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  transpilePackages: ['next-intl'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = withNextIntl(nextConfig);
