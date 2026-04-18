/**
 * Shared upstream resolution for all route handlers.
 *
 * Production (ippan.net): UPSTREAM_V1_BASES points at the HTTPS public gateway
 * (e.g. https://node.ippan.net). That gateway exposes only the public /v1/*
 * surface of the IPPAN L1 node.
 *
 * Development (preview / local): if UPSTREAM_V1_BASES is empty and
 * EXPLORER_INCLUDE_DEVNET=1 is set, the historical devnet HTTP IPs are used.
 * Leaving them unset in production keeps the UI tied to the single
 * production gateway.
 *
 * Server-side only (runs in Next.js API routes, not browser).
 */

const DEVNET_FALLBACK_UPSTREAMS = [
  "http://103.75.118.228:8080", // Tokyo
  "http://172.245.233.71:8080", // New York
  "http://51.158.157.222:8080", // Amsterdam
  "http://136.243.59.218:8080", // Falkenstein
  "http://38.127.61.11:8080",   // Miami 1
  "http://38.127.61.111:8080",  // Miami 2
];

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));
}

export function getUpstreams(): string[] {
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const configured = parseList(raw);

  if (configured.length > 0) {
    return configured;
  }

  // Only fall back to public devnet IPs when explicitly enabled (preview / local).
  const includeDevnet = (process.env.EXPLORER_INCLUDE_DEVNET ?? "").trim() === "1";
  return includeDevnet ? [...DEVNET_FALLBACK_UPSTREAMS] : [];
}

export function getFirstUpstream(): string {
  return getUpstreams()[0] ?? "";
}
