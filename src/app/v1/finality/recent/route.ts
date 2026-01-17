/* src/app/v1/finality/recent/route.ts */
/**
 * Cached finality snapshot endpoint.
 *
 * The /v1/finality/recent endpoint can be slow (15+ seconds on heavy nodes).
 * This route serves a cached snapshot immediately and refreshes in background.
 *
 * Env vars:
 *   FINALITY_SNAPSHOT_TTL_MS     - how long a snapshot is considered fresh (default: 5000)
 *   FINALITY_SNAPSHOT_TIMEOUT_MS - max time to wait for upstream refresh (default: 15000)
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Snapshot = {
  fetchedAt: number;
  upstream: string;
  body: string;
};

let SNAPSHOT: Snapshot | null = null;
let INFLIGHT: Promise<void> | null = null;

function nowMs(): number {
  return Date.now();
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function getUpstream(): string {
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/\/+$/, "");
}

async function refreshSnapshot(limit: string): Promise<void> {
  const upstream = getUpstream();
  if (!upstream) return;

  const timeoutMs = parseIntEnv("FINALITY_SNAPSHOT_TIMEOUT_MS", 15000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${upstream}/v1/finality/recent?limit=${encodeURIComponent(limit)}`;

    const headers: Record<string, string> = { accept: "application/json" };
    const key = (process.env.EXPLORER_PROXY_KEY ?? "").trim();
    if (key) headers["x-ippan-explorer-key"] = key;

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    const body = await res.text();

    // Only store if it looks successful
    if (res.ok) {
      SNAPSHOT = { fetchedAt: nowMs(), upstream, body };
    }
  } catch {
    // swallow errors: keep last-known-good snapshot
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "25";

  const ttlMs = parseIntEnv("FINALITY_SNAPSHOT_TTL_MS", 5000);

  const isFresh = SNAPSHOT && nowMs() - SNAPSHOT.fetchedAt < ttlMs;

  // If stale and no refresh running, kick off a background refresh
  if (!isFresh && !INFLIGHT) {
    INFLIGHT = refreshSnapshot(limit).finally(() => {
      INFLIGHT = null;
    });
  }

  // If we have a snapshot, return it immediately
  if (SNAPSHOT) {
    const res = new NextResponse(SNAPSHOT.body, { status: 200 });
    res.headers.set("content-type", "application/json");
    res.headers.set("x-ippan-finality-source", "snapshot");
    res.headers.set("x-ippan-finality-upstream", SNAPSHOT.upstream);
    res.headers.set("x-ippan-finality-age-ms", String(nowMs() - SNAPSHOT.fetchedAt));
    res.headers.set("cache-control", "public, s-maxage=2, stale-while-revalidate=10");
    return res;
  }

  // No snapshot yet: return a fast "warming up" response
  const warming = {
    ok: true,
    warming_up: true,
    hint: "Finality snapshot is initializing; retry in a few seconds.",
  };

  const res = NextResponse.json(warming, { status: 200 });
  res.headers.set("x-ippan-finality-source", "warming");
  res.headers.set("cache-control", "no-store");
  return res;
}
