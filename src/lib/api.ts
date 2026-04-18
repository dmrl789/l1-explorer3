/**
 * IPPAN L1 Explorer API Client
 * 
 * Supports both /v1/* endpoints and legacy endpoints with automatic fallback.
 */

import { fetchJson, fetchWithCompatibility, ApiRequestError } from './fetchJson';
import {
  // Status
  type Status,
  normalizeStatus,
  // Metrics
  type MetricsResponse,
  normalizeMetrics,
  // Blocks
  type BlocksListResponse,
  type BlockDetail,
  normalizeBlocksList,
  normalizeBlockDetail,
  // Rounds
  type RoundsListResponse,
  type RoundDetail,
  normalizeRoundsList,
  normalizeRoundDetail,
  // Transactions
  type TxListResponse,
  type TxDetail,
  normalizeTxList,
  normalizeTxDetail,
  // Search
  type SearchResponse,
  normalizeSearchResponse,
  // Audit
  type AuditReplayStatus,
  type CheckpointsListResponse,
  normalizeAuditReplayStatus,
  normalizeCheckpointsList,
  // Network
  type NetworkNodesResponse,
  normalizeNetworkNodes,
  // Proofs
  type ProofFinality,
  type ProofDlcFinality,
  type ProofBuild,
  type ProofPipeline,
  type ProofPerf,
  type ProofSizing,
  normalizeProofFinality,
  normalizeProofDlcFinality,
  normalizeProofBuild,
  normalizeProofPipeline,
  normalizeProofPerf,
  normalizeProofSizing,
} from './schemas';

// Re-export types for convenience
export type {
  Status,
  MetricsResponse,
  BlocksListResponse,
  BlockDetail,
  RoundsListResponse,
  RoundDetail,
  TxListResponse,
  TxDetail,
  SearchResponse,
  AuditReplayStatus,
  CheckpointsListResponse,
  NetworkNodesResponse,
  ProofFinality,
  ProofDlcFinality,
  ProofBuild,
  ProofPipeline,
  ProofPerf,
  ProofSizing,
};

export { ApiRequestError };

interface PaginationParams {
  limit?: number;
  cursor?: string;
}

interface TimeRangeParams {
  from?: number;
  to?: number;
  step?: number;
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  // Strip both null and undefined — some hooks (e.g. useSWRInfinite getKey for
  // page 0) seed `cursor` with null, and without this filter the URL would
  // carry the literal string "null" which strict backends reject.
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// ============================================================================
// Status
// ============================================================================

export async function getStatus(): Promise<Status> {
  const { data } = await fetchWithCompatibility<unknown>('/v1/status', '/status');
  return normalizeStatus(data);
}

// ============================================================================
// Metrics
// ============================================================================

export async function getMetricsSeries(params: TimeRangeParams = {}): Promise<MetricsResponse> {
  const query = buildQuery({
    from: params.from,
    to: params.to,
    step: params.step,
  });
  
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/metrics/series${query}`,
      `/metrics${query}`
    );
    return normalizeMetrics(data);
  } catch (error) {
    // Return empty metrics if unavailable
    if (error instanceof ApiRequestError) {
      return { series: [] };
    }
    throw error;
  }
}

// ============================================================================
// Rounds
// ============================================================================

export async function listRounds(params: PaginationParams = {}): Promise<RoundsListResponse> {
  const query = buildQuery({
    limit: params.limit ?? 20,
    cursor: params.cursor,
  });
  
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/rounds${query}`,
      `/rounds${query}`
    );
    return normalizeRoundsList(data);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { rounds: [], has_more: false };
    }
    throw error;
  }
}

export async function getRound(roundId: string | number): Promise<RoundDetail | null> {
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/rounds/${roundId}`,
      `/rounds/${roundId}`
    );
    return normalizeRoundDetail(data);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// Blocks
// ============================================================================

export async function listBlocks(params: PaginationParams = {}): Promise<BlocksListResponse> {
  const query = buildQuery({
    limit: params.limit ?? 20,
    cursor: params.cursor,
    // Ensure the explorer UI doesn't get "stuck" on cached proxy/CDN results.
    // `nocache=1` is stripped before forwarding to upstream by `proxyV1`.
    nocache: 1,
  });
  
  const { data } = await fetchWithCompatibility<unknown>(`/v1/blocks${query}`, `/blocks${query}`);
  const result = normalizeBlocksList(data);

  // If empty, mark as potentially having fallback issues
  if (result.blocks.length === 0) {
    return { ...result, _empty_warning: true } as BlocksListResponse & { _empty_warning?: boolean };
  }

  return result;
}

export async function getBlock(blockId: string): Promise<BlockDetail | null> {
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/blocks/${blockId}`,
      `/blocks/${blockId}`
    );
    return normalizeBlockDetail(data);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// Transactions
// ============================================================================

export async function listTx(params: PaginationParams = {}): Promise<TxListResponse> {
  const query = buildQuery({
    limit: params.limit ?? 20,
    cursor: params.cursor,
  });
  
  const { data } = await fetchWithCompatibility<unknown>(
    `/v1/transactions${query}`,
    `/tx${query}`
  );
  return normalizeTxList(data);
}

export async function getTx(txId: string): Promise<TxDetail | null> {
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/transactions/${txId}`,
      `/tx/${txId}`
    );
    return normalizeTxDetail(data);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// Search
// ============================================================================

export async function search(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent(query);
  
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/search?q=${q}`,
      `/search?q=${q}`
    );
    return normalizeSearchResponse(data, query);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { query, hits: [] };
    }
    throw error;
  }
}

// ============================================================================
// Audit / Replay
// ============================================================================

export async function getAuditReplayStatus(): Promise<AuditReplayStatus> {
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      '/v1/audit/replay',
      '/audit/status'
    );
    return normalizeAuditReplayStatus(data);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { status: 'unavailable' };
    }
    throw error;
  }
}

export async function listAuditCheckpoints(params: PaginationParams = {}): Promise<CheckpointsListResponse> {
  const query = buildQuery({
    limit: params.limit ?? 20,
    cursor: params.cursor,
  });
  
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/audit/checkpoints${query}`,
      `/audit/checkpoints${query}`
    );
    return normalizeCheckpointsList(data);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { checkpoints: [], has_more: false };
    }
    throw error;
  }
}

// ============================================================================
// Network
// ============================================================================

export async function listNetworkNodes(): Promise<NetworkNodesResponse> {
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      '/v1/network/nodes',
      '/nodes'
    );
    return normalizeNetworkNodes(data);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { nodes: [] };
    }
    throw error;
  }
}

// ============================================================================
// Proofs (DevNet Evidence)
// ============================================================================

export async function getProofFinality(): Promise<ProofFinality | null> {
  try {
    // Note: /v1/proof/dlc_finality returns the basic summary (despite the name)
    const data = await fetchJson<unknown>('/v1/proof/dlc_finality');
    return normalizeProofFinality(data);
  } catch {
    return null;
  }
}

export async function getProofDlcFinality(): Promise<ProofDlcFinality | null> {
  try {
    // Note: /v1/proof/finality returns the DLC-detailed data (node_id, lag_us, dual, async_writer)
    const data = await fetchJson<unknown>('/v1/proof/finality');
    return normalizeProofDlcFinality(data);
  } catch {
    return null;
  }
}

export async function getProofBuild(): Promise<ProofBuild | null> {
  try {
    const data = await fetchJson<unknown>('/v1/proof/build');
    return normalizeProofBuild(data);
  } catch {
    return null;
  }
}

export async function getProofPipeline(): Promise<ProofPipeline | null> {
  try {
    const data = await fetchJson<unknown>('/v1/proof/pipeline');
    return normalizeProofPipeline(data);
  } catch {
    return null;
  }
}

export async function getProofPerf(): Promise<ProofPerf | null> {
  try {
    const data = await fetchJson<unknown>('/v1/proof/perf');
    return normalizeProofPerf(data);
  } catch {
    return null;
  }
}

export async function getProofSizing(): Promise<ProofSizing | null> {
  try {
    const data = await fetchJson<unknown>('/v1/proof/sizing');
    return normalizeProofSizing(data);
  } catch {
    return null;
  }
}
