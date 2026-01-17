/* src/app/v1/network/nodes/route.ts */
/**
 * Normalized network nodes endpoint.
 *
 * The raw /v1/network/nodes returns 47+ peer connections, but we want to show
 * the actual VALIDATORS (4 nodes) for the explorer dashboard.
 *
 * We extract validator info from /v1/status which has:
 *   - validator_count: 4
 *   - validator_ids: [...]
 *   - consensus.validators: { id: { uptime, honesty, latency, ... } }
 *
 * This gives a clean "4 validators" view instead of raw P2P peer list.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ValidatorNode = {
  node_id: string;
  role: "validator";
  status: "online" | "offline" | "unknown";
  uptime_percent?: number;
  blocks_proposed?: number;
  blocks_verified?: number;
  latency_ms?: number;
  honesty_score?: number;
};

type Snapshot = {
  fetchedAt: number;
  upstream: string;
  nodes: ValidatorNode[];
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
    // Fetch /v1/status which contains validator info
    const url = `${upstream}/v1/status`;

    const headers: Record<string, string> = { accept: "application/json" };
    const key = (process.env.EXPLORER_PROXY_KEY ?? "").trim();
    if (key) headers["x-ippan-explorer-key"] = key;

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();

    // Extract validators from status response
    const validatorIds: string[] = data.validator_ids ?? data.validator_ids_sample ?? [];
    const validatorsData = data.consensus?.validators ?? {};

    const nodes: ValidatorNode[] = validatorIds.map((id: string) => {
      const v = validatorsData[id] ?? {};
      
      // Calculate uptime percent (backend returns 0-10000 scale)
      const uptimeRaw = v.uptime ?? 0;
      const uptimePercent = uptimeRaw > 100 ? uptimeRaw / 100 : uptimeRaw;

      return {
        node_id: id,
        role: "validator" as const,
        status: "online" as const, // If in validator list, assume online
        uptime_percent: uptimePercent,
        blocks_proposed: v.blocks_proposed,
        blocks_verified: v.blocks_verified,
        latency_ms: v.latency,
        honesty_score: v.honesty,
      };
    });

    if (nodes.length > 0) {
      SNAPSHOT = { fetchedAt: nowMs(), upstream, nodes };
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

  // If we have a snapshot, return normalized validator nodes
  if (SNAPSHOT && SNAPSHOT.nodes.length > 0) {
    const response = {
      nodes: SNAPSHOT.nodes,
      total_nodes: SNAPSHOT.nodes.length,
      online_nodes: SNAPSHOT.nodes.filter(n => n.status === "online").length,
    };

    const res = NextResponse.json(response, { status: 200 });
    res.headers.set("x-ippan-nodes-source", "validators");
    res.headers.set("x-ippan-nodes-count", String(SNAPSHOT.nodes.length));
    res.headers.set("x-ippan-nodes-age-ms", String(nowMs() - SNAPSHOT.fetchedAt));
    res.headers.set("cache-control", "public, s-maxage=5, stale-while-revalidate=30");
    return res;
  }

  // No snapshot available - return empty but valid response
  const warming = {
    nodes: [],
    total_nodes: 0,
    online_nodes: 0,
    warming_up: true,
    hint: "Validator data is initializing.",
  };

  const res = NextResponse.json(warming, { status: 200 });
  res.headers.set("x-ippan-nodes-source", "warming");
  res.headers.set("cache-control", "no-store");
  return res;
}
