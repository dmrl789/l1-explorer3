/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    const upstream =
      process.env.UPSTREAM_RPC_BASE?.replace(/\/$/, '') ??
      'http://api2.ippan.uk';
    return [
      // Blocks currently live on api1 (api2 may return HTML 404 for /v1/blocks).
      { source: '/v1/blocks/:path*', destination: 'http://api1.ippan.uk/v1/blocks/:path*' },
      // Proxy REST API via same-origin to avoid mixed-content + CORS in browsers.
      { source: '/v1/:path*', destination: `${upstream}/v1/:path*` },
      // Some API responses include `finality_cert_endpoint: "/finality/<id>"`.
      { source: '/finality/:path*', destination: `${upstream}/finality/:path*` },
    ];
  },
};

export default nextConfig;
