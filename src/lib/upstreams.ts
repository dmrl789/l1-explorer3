/**
 * Shared upstream resolution for all route handlers.
 * Devnet nodes are always included as primary upstreams.
 * UPSTREAM_V1_BASES env var adds additional upstreams (appended after devnet).
 * Server-side only (runs in Next.js API routes, not browser), so HTTP is fine.
 */

const DEVNET_UPSTREAMS = [
  "http://103.75.118.228:8080", // Tokyo
  "http://172.245.233.71:8080", // New York
  "http://51.158.157.222:8080", // Amsterdam
  "http://136.243.59.218:8080", // Falkenstein
  "http://38.127.61.11:8080",   // Miami 1
  "http://38.127.61.111:8080",  // Miami 2
];

export function getUpstreams(): string[] {
  // Devnet nodes are always primary — this is a devnet explorer.
  const all = [...DEVNET_UPSTREAMS];
  const set = new Set(all);

  // Append any additional upstreams from env var (e.g. production gateway).
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const extras = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));

  for (const u of extras) {
    if (!set.has(u)) {
      all.push(u);
      set.add(u);
    }
  }

  return all;
}

export function getFirstUpstream(): string {
  return getUpstreams()[0];
}
