import { z } from 'zod';

/**
 * Schema for blocks
 */
export const BlockSummarySchema = z.object({
  block_id: z.string(),
  hashtimer: z.string().optional(),
  round_id: z.union([z.string(), z.number()]).optional(),
  parent_count: z.number().optional().default(0),
  tx_count: z.number().optional().default(0),
  finalized: z.boolean().optional().default(false),
  timestamp: z.number().optional(),
  created_at: z.string().optional(),
});

export const BlockDetailSchema = BlockSummarySchema.extend({
  parents: z.array(z.string()).optional().default([]),
  children: z.array(z.string()).optional().default([]),
  transactions: z.array(z.string()).optional().default([]),
  proposer: z.string().optional(),
  size_bytes: z.number().optional(),
  deterministic_position: z.number().optional(),
  state_root: z.string().optional(),
});

export const BlocksListResponseSchema = z.object({
  blocks: z.array(BlockSummarySchema),
  cursor: z.string().optional().nullable(),
  has_more: z.boolean().optional().default(false),
  total: z.number().optional(),
});

export type BlockSummary = z.infer<typeof BlockSummarySchema>;
export type BlockDetail = z.infer<typeof BlockDetailSchema>;
export type BlocksListResponse = z.infer<typeof BlocksListResponseSchema>;

/**
 * Normalize legacy blocks response
 */
export function normalizeBlocksList(raw: unknown): BlocksListResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle array response
  if (Array.isArray(data)) {
    return {
      blocks: data.map(normalizeBlockSummary),
      has_more: false,
    };
  }
  
  // Handle object with blocks array
  const blocksRaw = data.blocks ?? data.items ?? data.data ?? data.results ?? [];
  const blocks = Array.isArray(blocksRaw) ? blocksRaw.map(normalizeBlockSummary) : [];
  
  return {
    blocks,
    cursor: (data.cursor ?? data.next_cursor ?? data.next) as string | undefined,
    has_more: Boolean(data.has_more ?? data.hasMore ?? !!data.cursor),
    total: data.total as number | undefined,
  };
}

export function normalizeBlockSummary(raw: unknown): BlockSummary {
  const data = raw as Record<string, unknown>;
  const parentsArr = data.parents as unknown[] | undefined;
  const txsArr = data.transactions as unknown[] | undefined;
  
  let parentCount = 0;
  if (data.parent_count !== undefined) {
    parentCount = Number(data.parent_count);
  } else if (parentsArr?.length !== undefined) {
    parentCount = parentsArr.length;
  } else if (data.parent) {
    parentCount = 1;
  }
  
  let txCount = 0;
  if (data.tx_count !== undefined) {
    txCount = Number(data.tx_count);
  } else if (data.transaction_count !== undefined) {
    txCount = Number(data.transaction_count);
  } else if (txsArr?.length !== undefined) {
    txCount = txsArr.length;
  } else if (data.txCount !== undefined) {
    txCount = Number(data.txCount);
  }
  
  return {
    block_id: String(data.block_id ?? data.id ?? data.hash ?? ''),
    hashtimer: (data.hashtimer ?? data.hash_timer) as string | undefined,
    round_id: (data.round_id ?? data.round) as string | number | undefined,
    parent_count: parentCount,
    tx_count: txCount,
    finalized: Boolean(data.finalized ?? data.is_finalized ?? data.final),
    timestamp: data.timestamp as number | undefined,
    created_at: (data.created_at ?? data.createdAt ?? data.time) as string | undefined,
  };
}

export function normalizeBlockDetail(raw: unknown): BlockDetail {
  const summary = normalizeBlockSummary(raw);
  const data = raw as Record<string, unknown>;
  
  const parents = data.parents ?? data.parent_ids ?? (data.parent ? [data.parent] : []);
  const children = data.children ?? data.child_ids ?? [];
  const transactions = data.transactions ?? data.tx_ids ?? data.txs ?? [];
  
  return {
    ...summary,
    parents: Array.isArray(parents) ? parents.map(String) : [],
    children: Array.isArray(children) ? children.map(String) : [],
    transactions: Array.isArray(transactions) ? transactions.map(String) : [],
    proposer: (data.proposer ?? data.producer ?? data.validator) as string | undefined,
    size_bytes: (data.size_bytes ?? data.size) as number | undefined,
    deterministic_position: (data.deterministic_position ?? data.position) as number | undefined,
    state_root: (data.state_root ?? data.stateRoot) as string | undefined,
  };
}
