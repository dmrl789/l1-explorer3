/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      // Proxy REST API via same-origin to avoid mixed-content + CORS in browsers.
      { source: '/v1/:path*', destination: 'http://api1.ippan.uk/v1/:path*' },
    ];
  },
};

export default nextConfig;
