/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    // Devnet defaults for /finality/* passthrough rewrite
    const upstreams = (process.env.UPSTREAM_V1_BASES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const upstream = upstreams[0] ?? "http://103.75.118.228:8080";

    return [
      {
        source: "/finality/:path*",
        destination: `${upstream}/finality/:path*`,
      },
    ];
  },
};

export default nextConfig;
