import { z } from 'zod';

/**
 * Schema for network status response
 */
export const IppanTimeSchema = z.object({
  value: z.number(),
  monotonic: z.boolean().optional().default(true),
  drift_ms: z.number().optional().default(0),
  source: z.string().optional(),
});

export const FinalityStatsSchema = z.object({
  p50_ms: z.number(),
  p95_ms: z.number(),
  p99_ms: z.number(),
});

export const NetworkHealthSchema = z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']);

export const StatusSchema = z.object({
  // Network identity
  network_id: z.string().optional(),
  network_name: z.string().optional().default('IPPAN DevNet'),
  chain_type: z.string().optional().default('L1'),
  
  // Health & version
  health: NetworkHealthSchema.optional().default('unknown'),
  version: z.string().optional(),
  commit: z.string().optional(),
  uptime_seconds: z.number().optional(),
  
  // IPPAN Time
  ippan_time: IppanTimeSchema.optional(),
  
  // Head state
  latest_round_id: z.union([z.string(), z.number()]).optional(),
  latest_block_id: z.union([z.string(), z.number()]).optional(),
  latest_hashtimer: z.string().optional(),
  
  // Finality stats
  finality: FinalityStatsSchema.optional(),
  
  // TPS
  accepted_tps: z.number().optional().default(0),
  finalized_tps: z.number().optional().default(0),
  
  // Validators
  active_validators: z.number().optional().default(0),
  shadow_verifiers: z.number().optional().default(0),
  total_nodes: z.number().optional().default(0),
  
  // Determinism indicators
  deterministic_ordering: z.boolean().optional().default(true),
  hashtimer_ordering: z.enum(['canonical', 'partial', 'disabled']).optional().default('canonical'),
  
  // Audit
  replay_status: z.enum(['pass', 'fail', 'running', 'unavailable']).optional().default('unavailable'),
  last_replay_time: z.string().optional(),
  
  // Config (for evidence page)
  config: z.record(z.string(), z.unknown()).optional(),
});

export type IppanTime = z.infer<typeof IppanTimeSchema>;
export type FinalityStats = z.infer<typeof FinalityStatsSchema>;
export type NetworkHealth = z.infer<typeof NetworkHealthSchema>;
export type Status = z.infer<typeof StatusSchema>;

/**
 * Normalize legacy status response to standard format
 */
export function normalizeStatus(raw: unknown): Status {
  // Handle various legacy formats
  const data = raw as Record<string, unknown>;
  
  const normalized: Record<string, unknown> = {
    ...data,
    // Normalize health field
    health: normalizeHealth(data.health ?? data.status ?? data.state),
    // Normalize IPPAN time
    ippan_time: normalizeIppanTime(data.ippan_time ?? data.time ?? data.timestamp),
    // Normalize finality
    finality: normalizeFinality(data.finality ?? data.finality_stats),
    // Normalize head state
    latest_round_id: data.latest_round_id ?? data.head_round ?? data.round,
    latest_block_id: data.latest_block_id ?? data.head_block ?? data.block,
    latest_hashtimer: data.latest_hashtimer ?? data.head_hashtimer ?? data.hashtimer,
    // Normalize TPS
    accepted_tps: data.accepted_tps ?? (data.tps as Record<string, unknown>)?.accepted ?? data.tps ?? 0,
    finalized_tps: data.finalized_tps ?? (data.tps as Record<string, unknown>)?.finalized ?? 0,
    // Normalize validators
    active_validators: data.active_validators ?? data.validators ?? 0,
    shadow_verifiers: data.shadow_verifiers ?? data.verifiers ?? 0,
    total_nodes: data.total_nodes ?? data.nodes ?? data.peer_count ?? 0,
  };
  
  return StatusSchema.parse(normalized);
}

function normalizeHealth(raw: unknown): NetworkHealth {
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower === 'healthy' || lower === 'ok' || lower === 'up' || lower === 'online') {
      return 'healthy';
    }
    if (lower === 'degraded' || lower === 'warning') {
      return 'degraded';
    }
    if (lower === 'unhealthy' || lower === 'down' || lower === 'error' || lower === 'offline') {
      return 'unhealthy';
    }
  }
  return 'unknown';
}

function normalizeIppanTime(raw: unknown): IppanTime | undefined {
  if (!raw) return undefined;
  
  if (typeof raw === 'number') {
    return { value: raw, monotonic: true, drift_ms: 0 };
  }
  
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      value: Number(obj.value ?? obj.timestamp ?? obj.time ?? 0),
      monotonic: Boolean(obj.monotonic ?? true),
      drift_ms: Number(obj.drift_ms ?? obj.drift ?? 0),
      source: obj.source as string | undefined,
    };
  }
  
  return undefined;
}

function normalizeFinality(raw: unknown): FinalityStats | undefined {
  if (!raw) return undefined;
  
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      p50_ms: Number(obj.p50_ms ?? obj.p50 ?? 0),
      p95_ms: Number(obj.p95_ms ?? obj.p95 ?? 0),
      p99_ms: Number(obj.p99_ms ?? obj.p99 ?? 0),
    };
  }
  
  return undefined;
}
