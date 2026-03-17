/**
 * Shared upstream resolution for all route handlers.
 * Reads UPSTREAM_V1_BASES env var; falls back to IPPAN devnet defaults.
 * Server-side only (runs in Next.js API routes, not browser), so HTTP is fine.
 */

const DEVNET_UPSTREAMS = [
  "http://103.75.118.228:8080", // Tokyo
  "http://172.245.233.71:8080", // New York
  "http://51.158.157.222:8080", // Amsterdam
  "http://136.243.59.218:8080", // Falkenstein
];

export function getUpstreams(): string[] {
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));
  return list.length ? list : DEVNET_UPSTREAMS;
}

export function getFirstUpstream(): string {
  return getUpstreams()[0];
}
