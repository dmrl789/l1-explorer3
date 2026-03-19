/* src/app/v1/status/route.ts */
/**
 * Cached status snapshot.
 * - Refresh stale snapshots synchronously with bounded timeout + upstream fallback.
 * - Serve last-known-good snapshot only when every upstream refresh attempt fails.
 * - Refresh at most once per STATUS_TTL_MS window.
 *
 * This keeps public status truthful while still shielding the UI from upstream outages.
 */

import { NextResponse } from "next/server";
import { getUpstreams } from "@/lib/upstreams";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function refreshSnapshot(): Promise<void> {
  const ups = getUpstreams();
  if (!ups.length) return;
  const timeoutMs = parseIntEnv("STATUS_SNAPSHOT_TIMEOUT_MS", 3500);
  const headers: Record<string, string> = { accept: "application/json" };
  const key = (process.env.EXPLORER_PROXY_KEY ?? "").trim();
  if (key) headers["x-ippan-explorer-key"] = key;

  for (const upstream of ups) {
    const url = `${upstream}/v1/status`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
        cache: "no-store",
      });

      const body = await res.text();
      if (!res.ok) {
        continue;
      }

      SNAPSHOT = { fetchedAt: nowMs(), upstream, status: res.status, body };
      return;
    } catch {
      // try next upstream
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function GET() {
  // Keep this tiny: the UI polls frequently and should not appear "stuck".
  // Still provides protection against very heavy upstream /v1/status responses.
  const ttlMs = Math.min(parseIntEnv("STATUS_SNAPSHOT_TTL_MS", 1000), 3000);

  const isFresh = SNAPSHOT && nowMs() - SNAPSHOT.fetchedAt < ttlMs;

  // If stale and no refresh running, kick off a refresh
  if (!isFresh && !INFLIGHT) {
    INFLIGHT = refreshSnapshot().finally(() => {
      INFLIGHT = null;
    });
  }

  // If we don't have a fresh snapshot, wait for the in-flight refresh before replying.
  // This avoids serving stale status when the upstream is healthy and responsive.
  if ((!isFresh || !SNAPSHOT) && INFLIGHT) {
    await INFLIGHT;
  }

  // If we have a snapshot, return it.
  if (SNAPSHOT) {
    const snapshotIsFresh = nowMs() - SNAPSHOT.fetchedAt < ttlMs;
    const res = new NextResponse(SNAPSHOT.body, { status: 200 });
    res.headers.set("content-type", "application/json; charset=utf-8");
    res.headers.set("x-ippan-status-source", "snapshot");
    res.headers.set("x-ippan-status-upstream", SNAPSHOT.upstream);
    res.headers.set("x-ippan-status-age-ms", String(nowMs() - SNAPSHOT.fetchedAt));
    res.headers.set("x-ippan-status-stale", snapshotIsFresh ? "0" : "1");
    // Absolutely no caching for time/status. This prevents browser/CDN/ISR from
    // serving stale status snapshots which can make IPPAN Time look like it
    // updates only every few seconds (or worse).
    res.headers.set(
      "cache-control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.headers.set("pragma", "no-cache");
    res.headers.set("expires", "0");
    return res;
  }

  // No snapshot available (upstream failed or not configured)
  const warming = {
    ok: true,
    warming_up: true,
    hint: "Status data unavailable; upstream may be down.",
  };

  const res = NextResponse.json(warming, { status: 200 });
  res.headers.set("x-ippan-status-source", "warming");
  res.headers.set("cache-control", "no-store");
  return res;
}
