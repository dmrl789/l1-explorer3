/* src/app/v1/_debug/route.ts */
import { NextResponse } from "next/server";
import { getUpstreams } from "@/lib/upstreams";

export const dynamic = "force-dynamic";

export async function GET() {
  const envRaw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const effective = getUpstreams();

  return NextResponse.json({
    ok: true,
    upstreams_env: envRaw || "(not set — using devnet defaults)",
    upstreams_effective: effective,
    timeoutMs: process.env.PROXY_TIMEOUT_MS ?? "3500",
    retries: process.env.PROXY_RETRIES ?? "2",
    cacheTtlMs: process.env.PROXY_CACHE_TTL_MS ?? "1000",
    hasProxyKey: Boolean((process.env.EXPLORER_PROXY_KEY ?? "").trim()),
  });
}
