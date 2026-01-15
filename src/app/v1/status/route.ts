import { NextResponse } from "next/server";

function upstreamBase(): string {
  return (process.env.UPSTREAM_RPC_BASE || "http://api2.ippan.uk").replace(/\/$/, "");
}

function upstreamFallbackBase(): string {
  // Keep a safety fallback in case api2 is unhealthy.
  return "http://api1.ippan.uk";
}

export const dynamic = "force-dynamic";

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchStatusFrom(base: string) {
  const upstream = new URL(`${base.replace(/\/$/, "")}/v1/status`);
  return fetchWithTimeout(upstream.toString(), 10_000);
}

export async function GET() {
  let r: Response;
  try {
    r = await fetchStatusFrom(upstreamBase());
  } catch {
    // If upstream times out or aborts, try fallback.
    r = await fetchStatusFrom(upstreamFallbackBase());
  }

  // If upstream returns 404/501 (compat), also try fallback.
  if (!r.ok && (r.status === 404 || r.status === 501)) {
    r = await fetchStatusFrom(upstreamFallbackBase());
  }

  const body = await r.arrayBuffer();
  const res = new NextResponse(body, { status: r.status });

  res.headers.set("x-ippan-proxy", "route:/v1/status");
  res.headers.set("cache-control", "no-store");

  const ct = r.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);

  const git = r.headers.get("x-ippan-git");
  if (git) res.headers.set("x-ippan-git", git);

  const buildTime = r.headers.get("x-ippan-build-time");
  if (buildTime) res.headers.set("x-ippan-build-time", buildTime);

  return res;
}

