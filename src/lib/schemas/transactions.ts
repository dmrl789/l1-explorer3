import { z } from 'zod';

/**
 * Schema for transactions
 */
export const TxTypeSchema = z.string().optional().default('unknown');

export const TxLifecycleStageSchema = z.enum([
  'ingress_checked',
  'hashtimer_assigned',
  'included_block',
  'included_round',
  'finalized',
]);

export const TxLifecycleEventSchema = z.object({
  stage: TxLifecycleStageSchema,
  timestamp: z.number().optional(),
  latency_ms: z.number().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const TxSummarySchema = z.object({
  tx_id: z.string(),
  hashtimer: z.string().optional(),
  type: TxTypeSchema,
  finalized: z.boolean().optional().default(false),
  round_id: z.union([z.string(), z.number()]).optional(),
  block_id: z.string().optional(),
  timestamp: z.number().optional(),
  created_at: z.string().optional(),
});

export const TxDetailSchema = TxSummarySchema.extend({
  lifecycle: z.array(TxLifecycleEventSchema).optional().default([]),
  total_latency_ms: z.number().optional(),
  sender: z.string().optional(),
  receiver: z.string().optional(),
  payload_hash: z.string().optional(),
  size_bytes: z.number().optional(),
  fee: z.number().optional(),
  nonce: z.number().optional(),
  signature: z.string().optional(),
});

export const TxListResponseSchema = z.object({
  transactions: z.array(TxSummarySchema),
  cursor: z.string().optional().nullable(),
  has_more: z.boolean().optional().default(false),
  total: z.number().optional(),
});

export type TxType = z.infer<typeof TxTypeSchema>;
export type TxLifecycleStage = z.infer<typeof TxLifecycleStageSchema>;
export type TxLifecycleEvent = z.infer<typeof TxLifecycleEventSchema>;
export type TxSummary = z.infer<typeof TxSummarySchema>;
export type TxDetail = z.infer<typeof TxDetailSchema>;
export type TxListResponse = z.infer<typeof TxListResponseSchema>;

/**
 * Normalize legacy transactions response
 */
export function normalizeTxList(raw: unknown): TxListResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle array response
  if (Array.isArray(data)) {
    return {
      transactions: data.map(normalizeTxSummary),
      has_more: false,
    };
  }
  
  // Handle object with transactions array
  const txsRaw = data.transactions ?? data.txs ?? data.items ?? data.data ?? data.results ?? [];
  const transactions = Array.isArray(txsRaw) ? txsRaw.map(normalizeTxSummary) : [];
  
  return {
    transactions,
    cursor: (data.cursor ?? data.next_cursor ?? data.next) as string | undefined,
    has_more: Boolean(data.has_more ?? data.hasMore ?? !!data.cursor),
    total: data.total as number | undefined,
  };
}

export function normalizeTxSummary(raw: unknown): TxSummary {
  const data = raw as Record<string, unknown>;
  
  return {
    tx_id: String(data.tx_id ?? data.id ?? data.hash ?? data.txId ?? ''),
    hashtimer: (data.hashtimer ?? data.hash_timer) as string | undefined,
    type: String(data.type ?? data.tx_type ?? data.txType ?? 'unknown'),
    finalized: Boolean(data.finalized ?? data.is_finalized ?? data.final),
    round_id: (data.round_id ?? data.round) as string | number | undefined,
    block_id: (data.block_id ?? data.block) as string | undefined,
    timestamp: data.timestamp as number | undefined,
    created_at: (data.created_at ?? data.createdAt ?? data.time) as string | undefined,
  };
}

export function normalizeTxDetail(raw: unknown): TxDetail {
  const summary = normalizeTxSummary(raw);
  const data = raw as Record<string, unknown>;
  
  const lifecycleRaw = data.lifecycle ?? data.events ?? data.stages ?? [];
  
  return {
    ...summary,
    lifecycle: Array.isArray(lifecycleRaw) 
      ? lifecycleRaw.map(normalizeLifecycleEvent) 
      : buildLifecycleFromFields(data),
    total_latency_ms: (data.total_latency_ms ?? data.latency) as number | undefined,
    sender: (data.sender ?? data.from ?? data.origin) as string | undefined,
    receiver: (data.receiver ?? data.to ?? data.destination) as string | undefined,
    payload_hash: (data.payload_hash ?? data.payloadHash ?? data.dataHash) as string | undefined,
    size_bytes: (data.size_bytes ?? data.size) as number | undefined,
    fee: data.fee as number | undefined,
    nonce: data.nonce as number | undefined,
    signature: data.signature as string | undefined,
  };
}

function normalizeLifecycleEvent(raw: unknown): TxLifecycleEvent {
  const data = raw as Record<string, unknown>;
  
  const stageStr = String(data.stage ?? data.event ?? data.name ?? '').toLowerCase();
  let stage: TxLifecycleStage = 'ingress_checked';
  
  if (stageStr.includes('ingress') || stageStr.includes('received')) {
    stage = 'ingress_checked';
  } else if (stageStr.includes('hashtimer') || stageStr.includes('ordered')) {
    stage = 'hashtimer_assigned';
  } else if (stageStr.includes('block')) {
    stage = 'included_block';
  } else if (stageStr.includes('round')) {
    stage = 'included_round';
  } else if (stageStr.includes('final')) {
    stage = 'finalized';
  }
  
  return {
    stage,
    timestamp: data.timestamp as number | undefined,
    latency_ms: (data.latency_ms ?? data.latency) as number | undefined,
    details: data.details as Record<string, unknown> | undefined,
  };
}

function buildLifecycleFromFields(data: Record<string, unknown>): TxLifecycleEvent[] {
  const events: TxLifecycleEvent[] = [];
  
  if (data.ingress_time ?? data.received_at) {
    events.push({
      stage: 'ingress_checked',
      timestamp: Number(data.ingress_time ?? data.received_at),
    });
  }
  
  if (data.hashtimer_time ?? data.ordered_at) {
    events.push({
      stage: 'hashtimer_assigned',
      timestamp: Number(data.hashtimer_time ?? data.ordered_at),
    });
  }
  
  if (data.block_time ?? data.included_at) {
    events.push({
      stage: 'included_block',
      timestamp: Number(data.block_time ?? data.included_at),
    });
  }
  
  if (data.round_time) {
    events.push({
      stage: 'included_round',
      timestamp: Number(data.round_time),
    });
  }
  
  if (data.finalized_time ?? data.finalized_at) {
    events.push({
      stage: 'finalized',
      timestamp: Number(data.finalized_time ?? data.finalized_at),
    });
  }
  
  return events;
}
