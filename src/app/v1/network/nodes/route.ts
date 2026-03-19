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
import { getFirstUpstream } from "@/lib/upstreams";

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
  source: string;
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

function extractValidators(data: Record<string, unknown>): ValidatorNode[] {
  // Extract validators from status response
  // validator_ids is inside consensus object, or use validator_ids_sample at top level
  const consensus = data.consensus as Record<string, unknown> | undefined;
  
  const validatorIds: string[] = 
    (consensus?.validator_ids as string[]) ?? 
    (data.validator_ids_sample as string[]) ?? 
    (data.validator_ids as string[]) ?? 
    [];
  
  const validatorsData = (consensus?.validators ?? {}) as Record<string, Record<string, unknown>>;

  return validatorIds.map((id: string) => {
    const v = validatorsData[id] ?? {};
    const connected = v.is_connected;
    const statusRaw = String(v.status ?? "").toLowerCase();
    
    // Calculate uptime percent (backend returns 0-10000 scale)
    const uptimeRaw = (v.uptime as number) ?? 0;
    const uptimePercent = uptimeRaw > 100 ? uptimeRaw / 100 : uptimeRaw;

    let status: ValidatorNode["status"] = "unknown";
    if (connected === true || statusRaw === "online" || statusRaw === "connected" || statusRaw === "active") {
      status = "online";
    } else if (connected === false || statusRaw === "offline" || statusRaw === "disconnected" || statusRaw === "inactive") {
      status = "offline";
    }

    return {
      node_id: id,
      role: "validator" as const,
      status,
      uptime_percent: uptimePercent,
      blocks_proposed: v.blocks_proposed as number | undefined,
      blocks_verified: v.blocks_verified as number | undefined,
      latency_ms: v.latency as number | undefined,
      honesty_score: v.honesty as number | undefined,
    };
  });
}

async function refreshSnapshot(): Promise<void> {
  const upstream = getFirstUpstream();
  if (!upstream) return;

  const timeoutMs = parseIntEnv("NETWORK_NODES_SNAPSHOT_TIMEOUT_MS", 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Fetch status from upstream to extract validator info
    const url = `${upstream}/v1/status`;

    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "accept": "application/json",
        "user-agent": "ippan-explorer/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[nodes] fetch failed: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    
    // Skip warming_up responses
    if (data.warming_up) {
      console.log(`[nodes] status is warming up, skipping`);
      return;
    }

    const nodes = extractValidators(data);
    console.log(`[nodes] extracted ${nodes.length} validators`);
    
    // Update snapshot
    SNAPSHOT = { fetchedAt: nowMs(), source: upstream, nodes };
  } catch (err) {
    // Log error for debugging
    console.error(`[nodes] refresh error:`, err);
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
  if (SNAPSHOT) {
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

  const response = {
    nodes: [],
    total_nodes: 0,
    online_nodes: 0,
    fallback: true,
  };

  const res = NextResponse.json(response, { status: 200 });
  res.headers.set("x-ippan-nodes-source", "fallback");
  res.headers.set("cache-control", "no-store");
  return res;
}
