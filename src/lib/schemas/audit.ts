import { z } from 'zod';

/**
 * Schema for audit/replay status and checkpoints
 */
export const ReplayStatusSchema = z.enum(['pass', 'fail', 'running', 'unavailable']);

export const AuditReplayStatusSchema = z.object({
  status: ReplayStatusSchema,
  last_run: z.string().optional(),
  last_run_timestamp: z.number().optional(),
  commit_fingerprint: z.string().optional(),
  version: z.string().optional(),
  from_round: z.union([z.string(), z.number()]).optional(),
  to_round: z.union([z.string(), z.number()]).optional(),
  verified_rounds: z.number().optional(),
  verified_blocks: z.number().optional(),
  verified_transactions: z.number().optional(),
  error_message: z.string().optional(),
  duration_ms: z.number().optional(),
});

export const CheckpointSchema = z.object({
  round_id: z.union([z.string(), z.number()]),
  hashtimer: z.string().optional(),
  state_root: z.string().optional(),
  round_root: z.string().optional(),
  tx_root: z.string().optional(),
  block_count: z.number().optional(),
  tx_count: z.number().optional(),
  timestamp: z.number().optional(),
  created_at: z.string().optional(),
  verified: z.boolean().optional().default(true),
});

export const CheckpointsListResponseSchema = z.object({
  checkpoints: z.array(CheckpointSchema),
  cursor: z.string().optional().nullable(),
  has_more: z.boolean().optional().default(false),
  total: z.number().optional(),
});

export type ReplayStatus = z.infer<typeof ReplayStatusSchema>;
export type AuditReplayStatus = z.infer<typeof AuditReplayStatusSchema>;
export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CheckpointsListResponse = z.infer<typeof CheckpointsListResponseSchema>;

/**
 * Normalize audit replay status response
 */
export function normalizeAuditReplayStatus(raw: unknown): AuditReplayStatus {
  const data = raw as Record<string, unknown>;
  
  let status: ReplayStatus = 'unavailable';
  const statusStr = String(data.status ?? data.state ?? data.result ?? '').toLowerCase();
  
  if (statusStr === 'pass' || statusStr === 'success' || statusStr === 'ok' || statusStr === 'verified') {
    status = 'pass';
  } else if (statusStr === 'fail' || statusStr === 'failed' || statusStr === 'error') {
    status = 'fail';
  } else if (statusStr === 'running' || statusStr === 'in_progress' || statusStr === 'pending') {
    status = 'running';
  }
  
  return {
    status,
    last_run: (data.last_run ?? data.lastRun ?? data.completed_at) as string | undefined,
    last_run_timestamp: (data.last_run_timestamp ?? data.timestamp) as number | undefined,
    commit_fingerprint: (data.commit_fingerprint ?? data.commit ?? data.commitHash) as string | undefined,
    version: data.version as string | undefined,
    from_round: (data.from_round ?? data.start_round) as string | number | undefined,
    to_round: (data.to_round ?? data.end_round) as string | number | undefined,
    verified_rounds: (data.verified_rounds ?? data.rounds) as number | undefined,
    verified_blocks: (data.verified_blocks ?? data.blocks) as number | undefined,
    verified_transactions: (data.verified_transactions ?? data.transactions) as number | undefined,
    error_message: (data.error_message ?? data.error) as string | undefined,
    duration_ms: (data.duration_ms ?? data.duration) as number | undefined,
  };
}

/**
 * Normalize checkpoints list response
 */
export function normalizeCheckpointsList(raw: unknown): CheckpointsListResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle array response
  if (Array.isArray(data)) {
    return {
      checkpoints: data.map(normalizeCheckpoint),
      has_more: false,
    };
  }
  
  // Handle object with checkpoints array
  const checkpointsRaw = data.checkpoints ?? data.items ?? data.data ?? data.results ?? [];
  const checkpoints = Array.isArray(checkpointsRaw) 
    ? checkpointsRaw.map(normalizeCheckpoint) 
    : [];
  
  return {
    checkpoints,
    cursor: (data.cursor ?? data.next_cursor ?? data.next) as string | undefined,
    has_more: Boolean(data.has_more ?? data.hasMore ?? !!data.cursor),
    total: data.total as number | undefined,
  };
}

function normalizeCheckpoint(raw: unknown): Checkpoint {
  const data = raw as Record<string, unknown>;
  
  return {
    round_id: (data.round_id ?? data.round ?? data.id ?? '') as string | number,
    hashtimer: (data.hashtimer ?? data.hash_timer) as string | undefined,
    state_root: (data.state_root ?? data.stateRoot) as string | undefined,
    round_root: (data.round_root ?? data.roundRoot) as string | undefined,
    tx_root: (data.tx_root ?? data.txRoot ?? data.transaction_root) as string | undefined,
    block_count: (data.block_count ?? data.blocks) as number | undefined,
    tx_count: (data.tx_count ?? data.transactions) as number | undefined,
    timestamp: data.timestamp as number | undefined,
    created_at: (data.created_at ?? data.createdAt) as string | undefined,
    verified: Boolean(data.verified ?? true),
  };
}
