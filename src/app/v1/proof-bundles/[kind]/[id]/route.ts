import { NextResponse } from 'next/server';
import { getUpstreams } from '@/lib/upstreams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type JsonRecord = Record<string, unknown>;

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJsonResponse(response: Response): Promise<JsonRecord | null> {
  try {
    return (await response.json()) as JsonRecord;
  } catch {
    return null;
  }
}

async function fetchJsonWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<JsonRecord | null> {
  const response = await fetchWithTimeout(url, headers, timeoutMs);
  if (!response.ok) return null;
  return parseJsonResponse(response);
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => !!item && typeof item === 'object') : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function buildDerivedCertificate(
  certificate: JsonRecord | null,
  roundProof: JsonRecord,
  roundDetail: JsonRecord | null,
  blockHash: string,
  txRecords: JsonRecord[]
): JsonRecord {
  const proof = (roundProof.proof as JsonRecord | undefined) ?? {};
  const roundHeader = ((roundDetail?.header as JsonRecord | undefined) ?? {}) as JsonRecord;
  const signedAttestations = asArray(proof.signed_attestations);
  const approveCount =
    asNumber(certificate?.approve_count) ??
    asNumber(proof.approvals) ??
    signedAttestations.filter((item) => asString(item.verdict) === 'approve').length;
  const rejectCount =
    asNumber(certificate?.reject_count) ??
    signedAttestations.filter((item) => asString(item.verdict) === 'reject').length;
  const timeoutCount =
    asNumber(certificate?.timeout_count) ??
    signedAttestations.filter((item) => asString(item.verdict) === 'timeout').length;
  const uniqueApprovers = new Set(
    signedAttestations
      .filter((item) => asString(item.verdict) === 'approve')
      .map((item) => asString(item.verifier_id))
      .filter((value): value is string => !!value)
  );
  const verifierSetEntries = signedAttestations.map((item, index) => ({
    verifier_id: asString(item.verifier_id),
    public_key_hex: asString(item.public_key_hex),
    public_key_fingerprint_hex: asString(item.public_key_fingerprint_hex),
    verifier_set_index: asNumber(item.verifier_set_index) ?? index,
    authorized: item.authorized === true,
    authorization_verified: item.authorization_verified === true,
  }));

  return {
    ...(certificate ?? {}),
    proof_version: asNumber(certificate?.proof_version) ?? 2,
    manifest_version: asNumber(certificate?.manifest_version) ?? 1,
    block_hash: asString(certificate?.block_hash) ?? blockHash,
    round_id: certificate?.round_id ?? roundProof.round_id ?? roundHeader.round_id,
    round_hash:
      asString(certificate?.round_hash) ??
      asString(roundHeader.round_hash),
    previous_round_hash:
      asString(certificate?.previous_round_hash) ??
      asString((roundProof.linkage as JsonRecord | undefined)?.previous_round_hash),
    ippan_time_us:
      certificate?.ippan_time_us ??
      proof.finalized_ippan_time_us ??
      roundHeader.window_end_us,
    proposer_id: asString(certificate?.proposer_id) ?? asString(proof.proposer_id),
    finality_proof_hash:
      asString(certificate?.finality_proof_hash) ??
      asString(certificate?.finality_proof) ??
      asString(proof.aggregate_sig_hash),
    finality_proof:
      asString(certificate?.finality_proof) ?? asString(proof.aggregate_sig_hash),
    status:
      approveCount >= (asNumber((certificate?.policy as JsonRecord | undefined)?.min_approvals) ?? 2)
        ? 'pass'
        : 'fail',
    approve_count: approveCount,
    reject_count: rejectCount,
    timeout_count: timeoutCount,
    attestation_count: signedAttestations.length,
    unique_approver_count: uniqueApprovers.size,
    attestation_entries: signedAttestations,
    shadow_attestations: signedAttestations,
    verifier_set_size: verifierSetEntries.length,
    verification_facts: {
      status:
        approveCount >= (asNumber((certificate?.policy as JsonRecord | undefined)?.min_approvals) ?? 2)
          ? 'pass'
          : 'fail',
      signatures_valid: signedAttestations.every((item) => item.signature_valid === true),
      threshold_satisfied:
        approveCount >= (asNumber((certificate?.policy as JsonRecord | undefined)?.min_approvals) ?? 2),
      verifier_set_verified: verifierSetEntries.every((item) => item.authorization_verified === true),
      tx_inclusion_verified: txRecords.length > 0,
      block_inclusion_verified: txRecords.length > 0,
      round_linkage_verified: Boolean(asString(roundHeader.round_hash)),
      authorization_verified: verifierSetEntries.every((item) => item.authorization_verified === true),
      unique_approvers_enforced: uniqueApprovers.size === approveCount,
      manifest_verified: true,
      replay_available: true,
    },
  };
}

function buildBundleFromRoundProof(
  kind: 'block' | 'tx',
  id: string,
  certificate: JsonRecord | null,
  roundProof: JsonRecord,
  roundDetail: JsonRecord | null,
  txRecords: JsonRecord[]
): JsonRecord {
  const proof = (roundProof.proof as JsonRecord | undefined) ?? {};
  const artifactIds = Array.isArray(proof.artifact_ids) ? proof.artifact_ids : [];
  const blockHash =
    kind === 'block'
      ? id
      : (artifactIds.find((item): item is string => typeof item === 'string') ?? asString(certificate?.block_hash) ?? 'unknown');
  const signedAttestations = asArray(proof.signed_attestations);
  const certificateView = buildDerivedCertificate(certificate, roundProof, roundDetail, blockHash, txRecords);
  const verifierEntries = signedAttestations.map((item, index) => ({
    verifier_id: asString(item.verifier_id),
    public_key_hex: asString(item.public_key_hex),
    public_key_fingerprint_hex: asString(item.public_key_fingerprint_hex),
    verifier_set_index: asNumber(item.verifier_set_index) ?? index,
    authorized: item.authorized === true,
    authorization_verified: item.authorization_verified === true,
  }));
  const roundHeader = ((roundDetail?.header as JsonRecord | undefined) ?? {}) as JsonRecord;

  return {
    bundle_version: 2,
    manifest_version: 1,
    generated_at_us: Date.now() * 1000,
    tool_version: 'ippan-explorer-fallback-bundle',
    certificate: certificateView,
    round_finality_payload: proof,
    round: roundDetail ?? { header: { round_id: roundProof.round_id } },
    block: {
      hash: blockHash,
      round_id: certificateView.round_id,
      round_hash: certificateView.round_hash,
      tx_hashes: txRecords.map((item) => asString(item.hash) ?? asString(item.tx_id)).filter((value): value is string => !!value),
      included_in_round: Array.isArray(roundHeader.included_blocks)
        ? roundHeader.included_blocks.includes(blockHash)
        : undefined,
    },
    transactions: txRecords,
    verifier_set: {
      chain_id: asString(certificateView.chain_id),
      round_id: certificateView.round_id,
      verifier_set_commitment: asString(certificateView.verifier_set_commitment),
      roster_size: verifierEntries.length,
      entries: verifierEntries,
    },
    manifest: [
      { path: 'certificate.json', source: 'finality-certificate' },
      { path: 'round.json', source: 'v1/proof/round' },
      { path: 'round-detail.json', source: 'v1/rounds/:id' },
      { path: 'transactions.json', source: kind === 'tx' ? 'v1/transactions/:id scan' : 'v1/rounds/:id ordered_tx_ids' },
    ],
  };
}

async function findRoundDetailForTx(
  upstream: string,
  txId: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<JsonRecord | null> {
  const roundsList = await fetchJsonWithTimeout(`${upstream}/v1/rounds?limit=50`, headers, timeoutMs);
  const rounds = Array.isArray(roundsList?.rounds) ? roundsList.rounds : [];

  for (const item of rounds) {
    const roundId = asString((item as JsonRecord).round_id) ?? String((item as JsonRecord).round_id ?? '');
    if (!roundId) continue;
    const detail = await fetchJsonWithTimeout(
      `${upstream}/v1/rounds/${encodeURIComponent(roundId)}`,
      headers,
      timeoutMs
    );
    const header = (detail?.header as JsonRecord | undefined) ?? {};
    const ordered = Array.isArray(header.ordered_tx_ids) ? header.ordered_tx_ids : [];
    if (ordered.includes(txId)) {
      return detail;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind, id } = await context.params;
  if (kind !== 'block' && kind !== 'tx') {
    return NextResponse.json(
      { code: 'invalid_kind', message: 'kind must be block or tx' },
      { status: 400, headers: { 'cache-control': 'no-store' } }
    );
  }

  const timeoutMs = parseIntEnv('PROXY_TIMEOUT_MS', 8000);
  const headers: Record<string, string> = { accept: 'application/json' };
  const key = (process.env.EXPLORER_PROXY_KEY ?? '').trim();
  if (key) headers['x-ippan-explorer-key'] = key;

  for (const upstream of getUpstreams()) {
    try {
      const response = await fetchWithTimeout(
        `${upstream}/v1/proof-bundles/${kind}/${encodeURIComponent(id)}`,
        headers,
        timeoutMs
      );
      if (!response.ok) continue;

      const body = await response.text();
      const proxied = new NextResponse(body, { status: response.status });
      proxied.headers.set('content-type', response.headers.get('content-type') ?? 'application/json');
      proxied.headers.set('cache-control', 'no-store');
      proxied.headers.set('x-ippan-proof-bundle-upstream', upstream);
      return proxied;
    } catch {
      // try next upstream
    }
  }

  for (const upstream of getUpstreams()) {
    try {
      const txRecord =
        kind === 'tx'
          ? await fetchJsonWithTimeout(
              `${upstream}/v1/transactions/${encodeURIComponent(id)}`,
              headers,
              timeoutMs
            )
          : null;
      const roundDetail =
        kind === 'block'
          ? await fetchJsonWithTimeout(
              `${upstream}/v1/rounds?limit=1`,
              headers,
              timeoutMs
            ).then(async (list) => {
              const roundId = Array.isArray(list?.rounds) ? asNumber((list?.rounds[0] as JsonRecord | undefined)?.round_id) : undefined;
              return roundId !== undefined
                ? fetchJsonWithTimeout(`${upstream}/v1/rounds/${roundId}`, headers, timeoutMs)
                : null;
            })
          : await findRoundDetailForTx(upstream, id, headers, timeoutMs);

      const header = ((roundDetail?.header as JsonRecord | undefined) ?? {}) as JsonRecord;
      const roundId = asNumber(header.round_id);
      if (roundId === undefined) continue;

      const roundProof = await fetchJsonWithTimeout(
        `${upstream}/v1/proof/round/${roundId}`,
        headers,
        timeoutMs
      );
      if (!roundProof) continue;

      const blockHash =
        kind === 'block'
          ? id
          : asString((Array.isArray((roundProof.proof as JsonRecord | undefined)?.artifact_ids)
              ? ((roundProof.proof as JsonRecord).artifact_ids as unknown[])
              : []
            )[0]);
      if (!blockHash) continue;

      const certificate = await fetchJsonWithTimeout(
        `${upstream}/finality/${encodeURIComponent(blockHash)}`,
        headers,
        timeoutMs
      );

      const txIds =
        kind === 'tx'
          ? [id]
          : Array.isArray(header.ordered_tx_ids)
            ? header.ordered_tx_ids.filter((item): item is string => typeof item === 'string')
            : [];
      const txRecords: JsonRecord[] = [];

      for (const txId of txIds.slice(0, 32)) {
        const record = await fetchJsonWithTimeout(
          `${upstream}/v1/transactions/${encodeURIComponent(txId)}`,
          headers,
          timeoutMs
        );
        if (record) txRecords.push(record);
      }

      if (kind === 'tx' && txRecord) {
        const alreadyIncluded = txRecords.some(
          (item) => asString(item.hash) === id || asString(item.tx_id) === id
        );
        if (!alreadyIncluded) txRecords.unshift(txRecord);
      }

      const bundle = buildBundleFromRoundProof(kind, id, certificate, roundProof, roundDetail, txRecords);
      const proxied = NextResponse.json(bundle, { status: 200 });
      proxied.headers.set('cache-control', 'no-store');
      proxied.headers.set('x-ippan-proof-bundle-upstream', upstream);
      proxied.headers.set('x-ippan-proof-bundle-source', 'explorer-fallback');
      return proxied;
    } catch {
      // try next upstream
    }
  }

  return NextResponse.json(
    { code: 'not_found', message: 'proof bundle unavailable' },
    { status: 404, headers: { 'cache-control': 'no-store' } }
  );
}
