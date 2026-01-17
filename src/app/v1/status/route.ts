/* src/app/v1/status/route.ts */
/**
 * Cached status snapshot.
 * - Fetch upstream /v1/status in the background-ish (on request) with long timeout.
 * - Serve last-known-good snapshot immediately.
 * - Refresh at most once per STATUS_TTL_MS window.
 *
 * This prevents the explorer from hanging if upstream /v1/status is heavy (15–60s).
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Snapshot = {
  fetchedAt: number;
  upstream: string;
  status: number;
  body: string; // JSON string
};

let SNAPSHOT: Snapshot | null = null;
let INFLIGHT: Promise<void> | null = null;

function nowMs() {
  return Date.now();
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function upstreams(): string[] {
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));
}

async function refreshSnapshot(): Promise<void> {
  const ups = upstreams();
  if (!ups.length) return;

  // pick first upstream for status; keep it simple and deterministic
  const upstream = ups[0];
  const url = `${upstream}/v1/status`;

  const timeoutMs = parseIntEnv("STATUS_SNAPSHOT_TIMEOUT_MS", 65000); // long, but not used often
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
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

    // only store if it looks like JSON and succeeded
    if (res.ok) {
      SNAPSHOT = { fetchedAt: nowMs(), upstream, status: res.status, body };
    }
  } catch {
    // swallow errors: we keep last-known-good snapshot
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const ttlMs = parseIntEnv("STATUS_SNAPSHOT_TTL_MS", 60000);

  const isFresh = SNAPSHOT && nowMs() - SNAPSHOT.fetchedAt < ttlMs;

  // If stale and no refresh running, kick off a refresh
  if (!isFresh && !INFLIGHT) {
    INFLIGHT = refreshSnapshot().finally(() => {
      INFLIGHT = null;
    });
  }

  // If we have a snapshot, return it immediately
  if (SNAPSHOT) {
    const res = new NextResponse(SNAPSHOT.body, { status: 200 });
    res.headers.set("content-type", "application/json");
    res.headers.set("x-ippan-status-source", "snapshot");
    res.headers.set("x-ippan-status-upstream", SNAPSHOT.upstream);
    res.headers.set("x-ippan-status-age-ms", String(nowMs() - SNAPSHOT.fetchedAt));
    res.headers.set("cache-control", "public, s-maxage=5, stale-while-revalidate=60");
    return res;
  }

  // No snapshot yet: return a fast "warming up" response (UI should handle)
  const warming = {
    ok: true,
    warming_up: true,
    hint: "Status snapshot is initializing; retry in a few seconds.",
  };

  const res = NextResponse.json(warming, { status: 200 });
  res.headers.set("x-ippan-status-source", "warming");
  res.headers.set("cache-control", "no-store");
  return res;
}
