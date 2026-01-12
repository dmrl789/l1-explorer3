import { z } from 'zod';

/**
 * Schema for rounds
 */
export const RoundStatusSchema = z.enum([
  'proposed',
  'verified',
  'finalized',
  'failed',
  'pending',
  'unknown',
]);

export const RoundParticipantSchema = z.object({
  node_id: z.string(),
  role: z.enum(['validator', 'shadow_verifier', 'observer']).optional(),
  signed: z.boolean().optional(),
  timestamp: z.number().optional(),
});

export const RoundProofSchema = z.object({
  threshold: z.number().optional(),
  signers: z.array(z.string()).optional().default([]),
  proof_hash: z.string().optional(),
  signature: z.string().optional(),
});

export const RoundSummarySchema = z.object({
  round_id: z.union([z.string(), z.number()]),
  hashtimer: z.string().optional(),
  status: RoundStatusSchema.optional().default('unknown'),
  finality_ms: z.number().optional(),
  block_count: z.number().optional().default(0),
  tx_count: z.number().optional().default(0),
  timestamp: z.number().optional(),
  created_at: z.string().optional(),
});

export const RoundDetailSchema = RoundSummarySchema.extend({
  blocks: z.array(z.string()).optional().default([]),
  participants: z.array(RoundParticipantSchema).optional().default([]),
  proof: RoundProofSchema.optional(),
  proposed_at: z.number().optional(),
  verified_at: z.number().optional(),
  finalized_at: z.number().optional(),
  state_root: z.string().optional(),
  round_root: z.string().optional(),
});

export const RoundsListResponseSchema = z.object({
  rounds: z.array(RoundSummarySchema),
  cursor: z.string().optional().nullable(),
  has_more: z.boolean().optional().default(false),
  total: z.number().optional(),
});

export type RoundStatus = z.infer<typeof RoundStatusSchema>;
export type RoundParticipant = z.infer<typeof RoundParticipantSchema>;
export type RoundProof = z.infer<typeof RoundProofSchema>;
export type RoundSummary = z.infer<typeof RoundSummarySchema>;
export type RoundDetail = z.infer<typeof RoundDetailSchema>;
export type RoundsListResponse = z.infer<typeof RoundsListResponseSchema>;

/**
 * Normalize legacy rounds response
 */
export function normalizeRoundsList(raw: unknown): RoundsListResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle array response
  if (Array.isArray(data)) {
    return {
      rounds: data.map(normalizeRoundSummary),
      has_more: false,
    };
  }
  
  // Handle object with rounds array
  const roundsRaw = data.rounds ?? data.items ?? data.data ?? data.results ?? [];
  const rounds = Array.isArray(roundsRaw) ? roundsRaw.map(normalizeRoundSummary) : [];
  
  return {
    rounds,
    cursor: (data.cursor ?? data.next_cursor ?? data.next) as string | undefined,
    has_more: Boolean(data.has_more ?? data.hasMore ?? !!data.cursor),
    total: data.total as number | undefined,
  };
}

export function normalizeRoundSummary(raw: unknown): RoundSummary {
  const data = raw as Record<string, unknown>;
  const blocksArr = data.blocks as unknown[] | undefined;
  
  return {
    round_id: (data.round_id ?? data.id ?? data.round ?? '') as string | number,
    hashtimer: (data.hashtimer ?? data.hash_timer) as string | undefined,
    status: normalizeRoundStatus(data.status ?? data.state),
    finality_ms: (data.finality_ms ?? data.finality) as number | undefined,
    block_count: Number(data.block_count ?? blocksArr?.length ?? data.blockCount ?? 0),
    tx_count: Number(data.tx_count ?? data.transaction_count ?? data.txCount ?? 0),
    timestamp: data.timestamp as number | undefined,
    created_at: (data.created_at ?? data.createdAt ?? data.time) as string | undefined,
  };
}

function normalizeRoundStatus(raw: unknown): RoundStatus {
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower === 'proposed' || lower === 'pending') return 'proposed';
    if (lower === 'verified' || lower === 'committed') return 'verified';
    if (lower === 'finalized' || lower === 'final' || lower === 'complete') return 'finalized';
    if (lower === 'failed' || lower === 'error') return 'failed';
  }
  return 'unknown';
}

export function normalizeRoundDetail(raw: unknown): RoundDetail {
  const summary = normalizeRoundSummary(raw);
  const data = raw as Record<string, unknown>;
  
  const blocksRaw = data.blocks ?? data.block_ids ?? [];
  const participantsRaw = data.participants ?? data.validators ?? data.signers ?? [];
  
  return {
    ...summary,
    blocks: Array.isArray(blocksRaw) ? blocksRaw.map(String) : [],
    participants: Array.isArray(participantsRaw) 
      ? participantsRaw.map(normalizeParticipant) 
      : [],
    proof: normalizeProof(data.proof ?? data.certificate),
    proposed_at: (data.proposed_at ?? data.proposedAt) as number | undefined,
    verified_at: (data.verified_at ?? data.verifiedAt) as number | undefined,
    finalized_at: (data.finalized_at ?? data.finalizedAt) as number | undefined,
    state_root: (data.state_root ?? data.stateRoot) as string | undefined,
    round_root: (data.round_root ?? data.roundRoot) as string | undefined,
  };
}

function normalizeParticipant(raw: unknown): RoundParticipant {
  if (typeof raw === 'string') {
    return { node_id: raw };
  }
  
  const data = raw as Record<string, unknown>;
  return {
    node_id: String(data.node_id ?? data.id ?? data.address ?? ''),
    role: (data.role as 'validator' | 'shadow_verifier' | 'observer' | undefined),
    signed: data.signed as boolean | undefined,
    timestamp: data.timestamp as number | undefined,
  };
}

function normalizeProof(raw: unknown): RoundProof | undefined {
  if (!raw) return undefined;
  
  const data = raw as Record<string, unknown>;
  const signersRaw = data.signers ?? data.signatures ?? [];
  
  return {
    threshold: data.threshold as number | undefined,
    signers: Array.isArray(signersRaw) ? signersRaw.map(String) : [],
    proof_hash: (data.proof_hash ?? data.proofHash ?? data.hash) as string | undefined,
    signature: data.signature as string | undefined,
  };
}
