/* src/app/v1/_debug/route.ts */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const upstreams = (process.env.UPSTREAM_V1_BASES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return NextResponse.json({
    ok: true,
    upstreams,
    timeoutMs: process.env.PROXY_TIMEOUT_MS ?? "3500",
    retries: process.env.PROXY_RETRIES ?? "2",
    cacheTtlMs: process.env.PROXY_CACHE_TTL_MS ?? "1000",
    hasProxyKey: Boolean((process.env.EXPLORER_PROXY_KEY ?? "").trim()),
  });
}
