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
      // Proxy REST API via same-origin to avoid mixed-content + CORS in browsers.
      { source: '/v1/:path*', destination: `${upstream}/v1/:path*` },
      // Some API responses include `finality_cert_endpoint: "/finality/<id>"`.
      { source: '/finality/:path*', destination: `${upstream}/finality/:path*` },
    ];
  },
};

export default nextConfig;
