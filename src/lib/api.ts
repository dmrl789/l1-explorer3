/**
 * IPPAN L1 Explorer API Client
 * 
 * Supports both /v1/* endpoints and legacy endpoints with automatic fallback.
 */

import { fetchWithCompatibility, ApiRequestError } from './fetchJson';
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

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// ============================================================================
// Status
// ============================================================================

export async function getStatus(): Promise<Status> {
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      '/v1/status',
      '/status'
    );
    return normalizeStatus(data);
  } catch (error) {
    // Return a minimal status object if API is completely unreachable
    if (error instanceof ApiRequestError) {
      return {
        network_name: 'IPPAN DevNet',
        chain_type: 'L1',
        health: 'unhealthy',
        deterministic_ordering: true,
        hashtimer_ordering: 'canonical',
        replay_status: 'unavailable',
        accepted_tps: 0,
        finalized_tps: 0,
        active_validators: 0,
        shadow_verifiers: 0,
        total_nodes: 0,
      };
    }
    throw error;
  }
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
  });
  
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/blocks${query}`,
      `/blocks${query}`
    );
    const result = normalizeBlocksList(data);
    
    // If empty, mark as potentially having fallback issues
    if (result.blocks.length === 0) {
      return { ...result, _empty_warning: true } as BlocksListResponse & { _empty_warning?: boolean };
    }
    
    return result;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { blocks: [], has_more: false };
    }
    throw error;
  }
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
  
  try {
    const { data } = await fetchWithCompatibility<unknown>(
      `/v1/transactions${query}`,
      `/tx${query}`
    );
    return normalizeTxList(data);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { transactions: [], has_more: false };
    }
    throw error;
  }
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
