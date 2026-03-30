import { getUpstreams } from "./upstreams";
import { formatIppanTimeUsToHashtimer } from "./format/hashtimer";
import { normalizeBlockDetail, normalizeBlockSummary } from "./schemas/blocks";

const DEFAULT_TIMEOUT_MS = 4000;

type UpstreamResult<T> = {
  data: T;
  upstream: string;
};

function buildAbortSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchJsonFromUpstreams<T>(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<UpstreamResult<T>> {
  const upstreams = getUpstreams();
  let lastError: Error | null = null;

  for (const upstream of upstreams) {
    const { signal, clear } = buildAbortSignal(timeoutMs);

    try {
      const response = await fetch(`${upstream}${path}`, {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${upstream}${path}`);
        continue;
      }

      const data = (await response.json()) as T;
      return { data, upstream };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clear();
    }
  }

  throw lastError ?? new Error(`All upstreams failed for ${path}`);
}

type RecentBlocksResponse = unknown[] | { blocks?: unknown[] };

function getBlocksArray(raw: RecentBlocksResponse): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.blocks)) return raw.blocks;
  return [];
}

function blockToRoundSummary(raw: unknown) {
  const block = normalizeBlockSummary(raw);

  return {
    round_id: block.round_id ?? block.block_id.replace(/^round:/, ""),
    hashtimer: block.hashtimer ?? formatIppanTimeUsToHashtimer(block.ippan_time),
    status: block.finalized ? "finalized" : "verified",
    finality_ms: undefined,
    block_count: 1,
    tx_count: block.tx_count,
    timestamp: block.ippan_time ?? block.timestamp,
    created_at: block.created_at,
  };
}

export async function fetchRecentRounds(params: { limit?: number }) {
  const limit = Math.max(1, Math.min(params.limit ?? 20, 100));
  const { data, upstream } = await fetchJsonFromUpstreams<RecentBlocksResponse>(
    `/v1/blocks?limit=${limit}`,
    DEFAULT_TIMEOUT_MS
  );

  const rounds = getBlocksArray(data)
    .map(blockToRoundSummary)
    .sort((a, b) => Number(b.round_id) - Number(a.round_id));

  return {
    upstream,
    payload: {
      rounds,
      has_more: false,
      total: rounds.length,
    },
  };
}

export async function fetchRoundDetail(roundId: string) {
  const { data, upstream } = await fetchJsonFromUpstreams<unknown>(
    `/v1/blocks/round:${encodeURIComponent(roundId)}`,
    DEFAULT_TIMEOUT_MS
  );

  const block = normalizeBlockDetail(data);

  return {
    upstream,
    payload: {
      round_id: block.round_id ?? roundId,
      hashtimer: block.hashtimer ?? formatIppanTimeUsToHashtimer(block.ippan_time),
      status: block.finalized ? "finalized" : "verified",
      finality_ms: undefined,
      block_count: 1,
      tx_count: block.tx_count,
      timestamp: block.ippan_time ?? block.timestamp,
      created_at: block.created_at,
      blocks: [block.block_id],
      participants: [],
      proof: undefined,
      proposed_at: block.ippan_time ?? block.timestamp,
      verified_at: block.finalized ? block.ippan_time ?? block.timestamp : undefined,
      finalized_at: block.finalized ? block.ippan_time ?? block.timestamp : undefined,
      state_root: undefined,
      round_root: block.block_id,
    },
  };
}
