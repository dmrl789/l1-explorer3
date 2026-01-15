/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    // api1.ippan.uk is currently down, use api2 for all routes
    const upstream =
      process.env.UPSTREAM_RPC_BASE?.replace(/\/$/, '') ??
      'http://api2.ippan.uk';
    return [
      // Route all API calls through api2 since api1 is down
      { source: '/v1/status', destination: `${upstream}/v1/status` },
      { source: '/v1/blocks', destination: `${upstream}/v1/blocks` },
      { source: '/v1/blocks/:path*', destination: `${upstream}/v1/blocks/:path*` },
      { source: '/v1/rounds', destination: `${upstream}/v1/rounds` },
      { source: '/v1/rounds/:path*', destination: `${upstream}/v1/rounds/:path*` },
      { source: '/v1/transactions', destination: `${upstream}/v1/transactions` },
      { source: '/v1/transactions/:path*', destination: `${upstream}/v1/transactions/:path*` },
      { source: '/v1/metrics/:path*', destination: `${upstream}/v1/metrics/:path*` },
      { source: '/v1/search', destination: `${upstream}/v1/search` },
      { source: '/v1/audit/:path*', destination: `${upstream}/v1/audit/:path*` },
      { source: '/v1/network/:path*', destination: `${upstream}/v1/network/:path*` },
      // Catch-all for other /v1 routes
      { source: '/v1/:path*', destination: `${upstream}/v1/:path*` },
      // Some API responses include `finality_cert_endpoint: "/finality/<id>"`.
      { source: '/finality/:path*', destination: `${upstream}/finality/:path*` },
    ];
  },
};

export default nextConfig;
