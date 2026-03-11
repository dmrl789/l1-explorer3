import { z } from 'zod';

/**
 * Schemas for /v1/proof/* endpoints
 * These provide cryptographic evidence of devnet operation.
 */

// --- /v1/proof/finality ---

export const ProofFinalitySchema = z.object({
  finalized_rounds_total: z.number(),
  finalized_txs_total: z.number(),
  last_finalized_round_id: z.number(),
  model_hash: z.string().optional(),
  features_commitment_hash: z.string().optional(),
  output_commitment_hash: z.string().optional(),
  latency_samples_total: z.number().optional(),
  round_ms: z.number().optional(),
  lane_groups: z.number().optional(),
});

export type ProofFinality = z.infer<typeof ProofFinalitySchema>;

// --- /v1/proof/dlc_finality ---

const LatencyStatsSchema = z.object({
  count: z.number(),
  min_us: z.number(),
  max_us: z.number(),
  p50_us: z.number(),
  p95_us: z.number(),
  p99_us: z.number(),
});

const DualConsistencySchema = z.object({
  consensus_finalized_txs_total: z.number(),
  consensus_finalized_rounds_total: z.number(),
  durable_finalized_txs_total: z.number(),
  durable_finalized_rounds_total: z.number(),
});

const AsyncWriterSchema = z.object({
  enabled: z.boolean(),
  queue_depth: z.number(),
  queue_capacity: z.number(),
  records_written: z.number(),
  write_errors: z.number(),
});

export const ProofDlcFinalitySchema = z.object({
  node_id: z.string(),
  chain_id: z.string(),
  finalized_round: z.union([z.string(), z.number()]),
  finalized_rounds_total: z.union([z.string(), z.number()]),
  finalized_blocklets_total: z.union([z.string(), z.number()]),
  finalized_txs_total: z.union([z.string(), z.number()]),
  finalized_bytes_total: z.union([z.string(), z.number()]),
  tip_round: z.union([z.string(), z.number()]).optional(),
  timestamp_unix_ms: z.union([z.string(), z.number()]).optional(),
  lag_us: LatencyStatsSchema.optional(),
  commit_us: LatencyStatsSchema.optional(),
  dual: DualConsistencySchema.optional(),
  async_writer: AsyncWriterSchema.optional(),
});

export type ProofDlcFinality = z.infer<typeof ProofDlcFinalitySchema>;

// --- /v1/proof/build ---

export const ProofBuildSchema = z.object({
  git_sha: z.string().optional(),
  build_profile: z.string().optional(),
  build_timestamp: z.string().optional(),
  consensus_mode_requested: z.string().optional(),
  consensus_mode_effective: z.string().optional(),
  legacy_poa_compiled: z.boolean().optional(),
  stage2b_compiled: z.boolean().optional(),
  dlc_compiled: z.boolean().optional(),
  direct_group_ingest_enabled: z.boolean().optional(),
  dispatchers_configured: z.number().optional(),
  node_id: z.string().optional(),
  active_env_flags: z.array(z.string()).optional(),
});

export type ProofBuild = z.infer<typeof ProofBuildSchema>;

// --- /v1/proof/pipeline ---

export const ProofPipelineSchema = z.object({
  config_echo: z.record(z.string(), z.string()).optional(),
  node_id: z.string().optional(),
  chain_id: z.string().optional(),
  http_received_txs_total: z.union([z.string(), z.number()]).optional(),
  admission_admitted_total: z.union([z.string(), z.number()]).optional(),
  admission_denied_total: z.union([z.string(), z.number()]).optional(),
  included_txs_total: z.union([z.string(), z.number()]).optional(),
  executed_ok_txs_total: z.union([z.string(), z.number()]).optional(),
  executed_err_txs_total: z.union([z.string(), z.number()]).optional(),
  committed_txs_total: z.union([z.string(), z.number()]).optional(),
  finalized_txs_total: z.union([z.string(), z.number()]).optional(),
  rounds_finalized_total: z.union([z.string(), z.number()]).optional(),
  mempool_len: z.union([z.string(), z.number()]).optional(),
  mempool_len_by_group: z.array(z.union([z.string(), z.number()])).optional(),
  blocklets_produced_total: z.union([z.string(), z.number()]).optional(),
  blocklets_produced_per_group_total: z.array(z.union([z.string(), z.number()])).optional(),
  txs_per_blocklet_max_observed: z.number().optional(),
  deny_rate_limit_total: z.union([z.string(), z.number()]).optional(),
  deny_duplicate_hash_total: z.union([z.string(), z.number()]).optional(),
  deny_invalid_signature_total: z.union([z.string(), z.number()]).optional(),
  admit_allow_total: z.union([z.string(), z.number()]).optional(),
  admit_deny_total: z.union([z.string(), z.number()]).optional(),
});

export type ProofPipeline = z.infer<typeof ProofPipelineSchema>;

// --- /v1/proof/perf ---

const Stage2bPerfSchema = z.object({
  enabled: z.boolean().optional(),
  tps: z.object({
    included_1s: z.number(),
    included_10s: z.number(),
    finalized_1s: z.number(),
    finalized_10s: z.number(),
  }).optional(),
  lag_ms: z.object({
    p50: z.number(),
    p95: z.number(),
  }).optional(),
  micros_p95: z.object({
    build: z.number(),
    assemble: z.number(),
    commit: z.number(),
  }).optional(),
  queues: z.object({
    builder_depth: z.array(z.number()).optional(),
    assembler_depth: z.number().optional(),
    txs_dropped_queue_full: z.number().optional(),
    rounds_empty: z.number().optional(),
  }).optional(),
  rounds_assembled_total: z.number().optional(),
  finalized_txs_total: z.number().optional(),
  finalized_elapsed_secs: z.number().optional(),
  finalized_tps_delta: z.number().optional(),
});

const StoragePerfSchema = z.object({
  fsync_us_total: z.number().optional(),
  fsync_calls_total: z.number().optional(),
  wal_appends_total: z.number().optional(),
});

export const ProofPerfSchema = z.object({
  shadow_mode: z.string().optional(),
  commit_mode: z.string().optional(),
  fsync_every_n_rounds: z.number().optional(),
  round_max_txs: z.number().optional(),
  round_ms: z.number().optional(),
  lane_groups: z.number().optional(),
  stage2b: Stage2bPerfSchema.optional(),
  storage: StoragePerfSchema.optional(),
});

export type ProofPerf = z.infer<typeof ProofPerfSchema>;

// --- /v1/proof/sizing ---

export const ProofSizingSchema = z.object({
  sizing_mode: z.string().optional(),
  round_tick_us: z.number().optional(),
  rounds_per_sec: z.number().optional(),
  commitment_batch_mode: z.boolean().optional(),
});

export type ProofSizing = z.infer<typeof ProofSizingSchema>;

// --- Normalizers ---

export function normalizeProofFinality(raw: unknown): ProofFinality {
  const data = raw as Record<string, unknown>;
  return {
    finalized_rounds_total: Number(data.finalized_rounds_total ?? 0),
    finalized_txs_total: Number(data.finalized_txs_total ?? 0),
    last_finalized_round_id: Number(data.last_finalized_round_id ?? 0),
    model_hash: data.model_hash as string | undefined,
    features_commitment_hash: data.features_commitment_hash as string | undefined,
    output_commitment_hash: data.output_commitment_hash as string | undefined,
    latency_samples_total: data.latency_samples_total as number | undefined,
    round_ms: data.round_ms as number | undefined,
    lane_groups: data.lane_groups as number | undefined,
  };
}

export function normalizeProofDlcFinality(raw: unknown): ProofDlcFinality {
  const data = raw as Record<string, unknown>;
  return {
    node_id: String(data.node_id ?? ''),
    chain_id: String(data.chain_id ?? '0'),
    finalized_round: data.finalized_round ?? 0,
    finalized_rounds_total: data.finalized_rounds_total ?? 0,
    finalized_blocklets_total: data.finalized_blocklets_total ?? 0,
    finalized_txs_total: data.finalized_txs_total ?? 0,
    finalized_bytes_total: data.finalized_bytes_total ?? 0,
    tip_round: data.tip_round,
    timestamp_unix_ms: data.timestamp_unix_ms,
    lag_us: data.lag_us as ProofDlcFinality['lag_us'],
    commit_us: data.commit_us as ProofDlcFinality['commit_us'],
    dual: data.dual as ProofDlcFinality['dual'],
    async_writer: data.async_writer as ProofDlcFinality['async_writer'],
  } as ProofDlcFinality;
}

export function normalizeProofBuild(raw: unknown): ProofBuild {
  const data = raw as Record<string, unknown>;
  return {
    git_sha: data.git_sha as string | undefined,
    build_profile: data.build_profile as string | undefined,
    build_timestamp: data.build_timestamp as string | undefined,
    consensus_mode_requested: data.consensus_mode_requested as string | undefined,
    consensus_mode_effective: data.consensus_mode_effective as string | undefined,
    legacy_poa_compiled: data.legacy_poa_compiled as boolean | undefined,
    stage2b_compiled: data.stage2b_compiled as boolean | undefined,
    dlc_compiled: data.dlc_compiled as boolean | undefined,
    direct_group_ingest_enabled: data.direct_group_ingest_enabled as boolean | undefined,
    dispatchers_configured: data.dispatchers_configured as number | undefined,
    node_id: data.node_id as string | undefined,
    active_env_flags: data.active_env_flags as string[] | undefined,
  };
}

export function normalizeProofPipeline(raw: unknown): ProofPipeline {
  return raw as ProofPipeline;
}

export function normalizeProofPerf(raw: unknown): ProofPerf {
  return raw as ProofPerf;
}

export function normalizeProofSizing(raw: unknown): ProofSizing {
  const data = raw as Record<string, unknown>;
  return {
    sizing_mode: data.sizing_mode as string | undefined,
    round_tick_us: data.round_tick_us as number | undefined,
    rounds_per_sec: data.rounds_per_sec as number | undefined,
    commitment_batch_mode: data.commitment_batch_mode as boolean | undefined,
  };
}
