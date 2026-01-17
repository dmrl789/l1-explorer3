/* src/app/v1/network/nodes/route.ts */
/**
 * Cached network nodes snapshot endpoint.
 *
 * The /v1/network/nodes endpoint can sometimes be slow through the proxy.
 * This route serves a cached snapshot immediately and refreshes in background.
 *
 * Env vars:
 *   NETWORK_NODES_SNAPSHOT_TTL_MS     - how long snapshot is fresh (default: 10000)
 *   NETWORK_NODES_SNAPSHOT_TIMEOUT_MS - max wait for upstream (default: 8000)
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

async function refreshSnapshot(): Promise<void> {
  const upstream = getUpstream();
  if (!upstream) return;

  const timeoutMs = parseIntEnv("NETWORK_NODES_SNAPSHOT_TIMEOUT_MS", 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${upstream}/v1/network/nodes`;

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

    if (res.ok) {
      SNAPSHOT = { fetchedAt: nowMs(), upstream, body };
    }
  } catch {
    // swallow errors: keep last-known-good snapshot
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const ttlMs = parseIntEnv("NETWORK_NODES_SNAPSHOT_TTL_MS", 10000);

  const isFresh = SNAPSHOT && nowMs() - SNAPSHOT.fetchedAt < ttlMs;

  // If stale and no refresh running, kick off refresh
  if (!isFresh && !INFLIGHT) {
    INFLIGHT = refreshSnapshot().finally(() => {
      INFLIGHT = null;
    });
  }

  // If no snapshot exists yet, WAIT for the first fetch to complete
  if (!SNAPSHOT && INFLIGHT) {
    await INFLIGHT;
  }

  // If we have a snapshot, return it immediately
  if (SNAPSHOT) {
    const res = new NextResponse(SNAPSHOT.body, { status: 200 });
    res.headers.set("content-type", "application/json");
    res.headers.set("x-ippan-nodes-source", "snapshot");
    res.headers.set("x-ippan-nodes-upstream", SNAPSHOT.upstream);
    res.headers.set("x-ippan-nodes-age-ms", String(nowMs() - SNAPSHOT.fetchedAt));
    res.headers.set("cache-control", "public, s-maxage=5, stale-while-revalidate=30");
    return res;
  }

  // No snapshot available (upstream failed or not configured)
  const warming = {
    ok: true,
    warming_up: true,
    nodes: [],
    hint: "Network nodes data unavailable; upstream may be down.",
  };

  const res = NextResponse.json(warming, { status: 200 });
  res.headers.set("x-ippan-nodes-source", "warming");
  res.headers.set("cache-control", "no-store");
  return res;
}
