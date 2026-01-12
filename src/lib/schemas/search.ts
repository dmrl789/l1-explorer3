import { z } from 'zod';

/**
 * Schema for search results
 */
export const SearchHitTypeSchema = z.enum([
  'transaction',
  'block',
  'round',
  'node',
  'unknown',
]);

export const SearchHitSchema = z.object({
  type: SearchHitTypeSchema,
  id: z.string(),
  hashtimer: z.string().optional(),
  summary: z.string().optional(),
  score: z.number().optional(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  hits: z.array(SearchHitSchema),
  total: z.number().optional(),
});

export type SearchHitType = z.infer<typeof SearchHitTypeSchema>;
export type SearchHit = z.infer<typeof SearchHitSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Normalize search response
 */
export function normalizeSearchResponse(raw: unknown, query: string): SearchResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle array response
  if (Array.isArray(data)) {
    return {
      query,
      hits: data.map(normalizeSearchHit),
    };
  }
  
  // Handle object with results array
  const hitsRaw = data.hits ?? data.results ?? data.items ?? data.data ?? [];
  const hits = Array.isArray(hitsRaw) ? hitsRaw.map(normalizeSearchHit) : [];
  
  return {
    query: String(data.query ?? query),
    hits,
    total: data.total as number | undefined,
  };
}

function normalizeSearchHit(raw: unknown): SearchHit {
  const data = raw as Record<string, unknown>;
  
  const typeStr = String(data.type ?? data.entity_type ?? '').toLowerCase();
  let type: SearchHitType = 'unknown';
  
  if (typeStr.includes('tx') || typeStr.includes('transaction')) {
    type = 'transaction';
  } else if (typeStr.includes('block')) {
    type = 'block';
  } else if (typeStr.includes('round')) {
    type = 'round';
  } else if (typeStr.includes('node') || typeStr.includes('validator')) {
    type = 'node';
  }
  
  return {
    type,
    id: String(data.id ?? data.hash ?? data.tx_id ?? data.block_id ?? data.round_id ?? ''),
    hashtimer: (data.hashtimer ?? data.hash_timer) as string | undefined,
    summary: (data.summary ?? data.description ?? data.preview) as string | undefined,
    score: data.score as number | undefined,
  };
}

/**
 * Detect search query type based on pattern
 */
export function detectSearchType(query: string): SearchHitType | null {
  const trimmed = query.trim();
  
  // Round ID patterns (typically numeric or prefixed)
  if (/^(round[-_:]?)?\d+$/i.test(trimmed)) {
    return 'round';
  }
  
  // Block ID patterns (hex hash)
  if (/^(block[-_:]?)?[0-9a-f]{64}$/i.test(trimmed)) {
    return 'block';
  }
  
  // Transaction ID patterns (hex hash)
  if (/^(tx[-_:]?)?[0-9a-f]{64}$/i.test(trimmed)) {
    return 'transaction';
  }
  
  // Generic hex hash (could be block or tx)
  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    return null; // Let API decide
  }
  
  // Node ID patterns
  if (/^(node[-_:]?)?[0-9a-f]{40,}$/i.test(trimmed)) {
    return 'node';
  }
  
  return null;
}
