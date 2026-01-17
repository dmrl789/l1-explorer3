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

function getUpstream(): string {
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/\/+$/, "");
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
    
    // Calculate uptime percent (backend returns 0-10000 scale)
    const uptimeRaw = (v.uptime as number) ?? 0;
    const uptimePercent = uptimeRaw > 100 ? uptimeRaw / 100 : uptimeRaw;

    return {
      node_id: id,
      role: "validator" as const,
      status: "online" as const, // If in validator list, assume online
      uptime_percent: uptimePercent,
      blocks_proposed: v.blocks_proposed as number | undefined,
      blocks_verified: v.blocks_verified as number | undefined,
      latency_ms: v.latency as number | undefined,
      honesty_score: v.honesty as number | undefined,
    };
  });
}

async function refreshSnapshot(): Promise<void> {
  const upstream = getUpstream();
  if (!upstream) return;

  const timeoutMs = parseIntEnv("NETWORK_NODES_SNAPSHOT_TIMEOUT_MS", 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Fetch status directly from upstream with explicit URL
    const url = `https://api2.ippan.uk/v1/status`;

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

  // No snapshot available - return fallback with known validator IDs
  // These are the 4 validators from the DevNet
  const fallbackNodes: ValidatorNode[] = [
    { node_id: "254451713534628ea230235ed2b49dd66e30ae378c631e4e04c07b7a14c2bfcb", role: "validator", status: "online" },
    { node_id: "460c56d288d1d77a8f0f0a0e6a403fe8c2f0a2fc20e153a34d5ebafc08c520d2", role: "validator", status: "online" },
    { node_id: "60a53cdfed305dd03e389642e737c5737603b01e6ab0ae0cba8fa46f701860dd", role: "validator", status: "online" },
    { node_id: "df312d197f089118a7095cd466cdf84527f6b4062774b825a41b2371bc874743", role: "validator", status: "online" },
  ];

  const response = {
    nodes: fallbackNodes,
    total_nodes: fallbackNodes.length,
    online_nodes: fallbackNodes.length,
    fallback: true,
  };

  const res = NextResponse.json(response, { status: 200 });
  res.headers.set("x-ippan-nodes-source", "fallback");
  res.headers.set("cache-control", "no-store");
  return res;
}
