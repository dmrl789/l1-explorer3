import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Vercel
  output: 'standalone',
  // Skip type checking in CI (will be done separately)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
