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
      { source: '/v1/blocks/:path*', destination: `${upstream}/v1/blocks/:path*` },
      // Proxy REST API via same-origin to avoid mixed-content + CORS in browsers.
      { source: '/v1/:path*', destination: `${upstream}/v1/:path*` },
      // Some API responses include `finality_cert_endpoint: "/finality/<id>"`.
      { source: '/finality/:path*', destination: `${upstream}/finality/:path*` },
    ];
  },
};

export default nextConfig;
