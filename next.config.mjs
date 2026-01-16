/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    const upstreams = (process.env.UPSTREAM_V1_BASES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const upstream = upstreams[0] ?? "https://gateway.ippan.net";

    return [
      {
        source: "/finality/:path*",
        destination: `${upstream}/finality/:path*`,
      },
    ];
  },
};

export default nextConfig;
