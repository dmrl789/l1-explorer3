import { z } from 'zod';

export const FinalityAttestationSchema = z
  .object({
    verifier_id: z.string().optional(),
    verdict: z.string().optional(),
    signature_hex: z.string().optional(),
    signature_algorithm: z.string().optional(),
    public_key_hex: z.string().optional(),
    public_key_fingerprint_hex: z.string().optional(),
    signed_payload_hash: z.string().optional(),
    attestation_canonical_bytes_hash: z.string().optional(),
    authorized: z.boolean().optional(),
    signature_valid: z.boolean().optional(),
    authorization_verified: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const FinalityPolicySchema = z.object({
  min_approvals: z.number().optional(),
  max_rejects: z.number().optional(),
  treat_timeouts_as_reject: z.boolean().optional(),
});

export const VerificationFactsSchema = z
  .object({
    status: z.string().optional(),
    signatures_valid: z.boolean().optional(),
    threshold_satisfied: z.boolean().optional(),
    verifier_set_verified: z.boolean().optional(),
    tx_inclusion_verified: z.boolean().optional(),
    block_inclusion_verified: z.boolean().optional(),
    round_linkage_verified: z.boolean().optional(),
    authorization_verified: z.boolean().optional(),
    unique_approvers_enforced: z.boolean().optional(),
    manifest_verified: z.boolean().optional(),
    replay_available: z.boolean().optional(),
  })
  .optional();

export const ReplayManifestSchema = z
  .object({
    verify_certificate_command: z.string().optional(),
    verify_proof_bundle_command: z.string().optional(),
    replay_round_command: z.string().optional(),
    replay_tx_command: z.string().optional(),
  })
  .optional();

export const FinalityCertificateSchema = z
  .object({
    proof_version: z.number().optional(),
    version: z.number().optional(),
    certificate_version: z.number().optional(),
    manifest_version: z.number().optional(),
    chain_id: z.string().optional(),
    round_id: z.union([z.string(), z.number()]).optional(),
    round_hash: z.string().optional(),
    previous_round_hash: z.string().optional(),
    block_hash: z.string().optional(),
    ippan_time_us: z.union([z.string(), z.number()]).optional(),
    primary_id: z.string().optional(),
    proposer_id: z.string().optional(),
    finality_proof: z.string().optional(),
    finality_proof_hash: z.string().optional(),
    status: z.string().optional(),
    shadow_attestations: z.array(FinalityAttestationSchema).optional().default([]),
    escalation_attestations: z.array(FinalityAttestationSchema).optional().default([]),
    attestation_entries: z.array(FinalityAttestationSchema).optional().default([]),
    policy: FinalityPolicySchema.optional(),
    approve_count: z.number().optional(),
    reject_count: z.number().optional(),
    timeout_count: z.number().optional(),
    attestation_count: z.number().optional(),
    canonical_encoding_version: z.number().optional(),
    proof_format_valid: z.boolean().optional(),
    threshold_satisfied: z.boolean().optional(),
    unique_approver_count: z.number().optional(),
    unique_rejector_count: z.number().optional(),
    proof_payload_hash: z.string().optional(),
    certificate_payload_hash: z.string().optional(),
    canonical_signed_bytes_hash: z.string().optional(),
    canonical_signed_bytes_hex: z.string().optional(),
    verifier_set_commitment: z.string().optional(),
    verifier_set_size: z.number().optional(),
    verification_facts: VerificationFactsSchema,
    replay_manifest: ReplayManifestSchema,
  })
  .catchall(z.unknown());

export const FinalityProofBundleSchema = z
  .object({
    bundle_version: z.number().optional(),
    manifest_version: z.number().optional(),
    generated_at_us: z.union([z.string(), z.number()]).optional(),
    tool_version: z.string().optional(),
    git_commit: z.string().optional(),
    certificate: FinalityCertificateSchema.optional(),
    certificate_canonical: z.record(z.string(), z.unknown()).optional(),
    round_finality_payload: z.record(z.string(), z.unknown()).optional(),
    round_canonical: z.record(z.string(), z.unknown()).optional(),
    verifier_set: z
      .object({
        chain_id: z.string().optional(),
        round_id: z.union([z.string(), z.number()]).optional(),
        verifier_set_commitment: z.string().optional(),
        roster_size: z.number().optional(),
        canonical_payload_hash: z.string().optional(),
        entries: z.array(z.record(z.string(), z.unknown())).optional().default([]),
      })
      .optional(),
    verifier_set_canonical: z.record(z.string(), z.unknown()).optional(),
    round: z.record(z.string(), z.unknown()).optional(),
    block: z.record(z.string(), z.unknown()).optional(),
    transactions: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    verifier_version_info: z.record(z.string(), z.unknown()).optional(),
    manifest: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  })
  .catchall(z.unknown());

export type FinalityAttestation = z.infer<typeof FinalityAttestationSchema>;
export type FinalityPolicy = z.infer<typeof FinalityPolicySchema>;
export type FinalityCertificate = z.infer<typeof FinalityCertificateSchema>;
export type FinalityProofBundle = z.infer<typeof FinalityProofBundleSchema>;

export function normalizeFinalityCertificate(raw: unknown): FinalityCertificate {
  const data = raw as Record<string, unknown>;
  const shadowAttestations = Array.isArray(data.shadow_attestations) ? data.shadow_attestations : [];
  const escalationAttestations = Array.isArray(data.escalation_attestations)
    ? data.escalation_attestations
    : [];
  const attestationEntries = Array.isArray(data.attestation_entries)
    ? data.attestation_entries
    : shadowAttestations;
  const minApprovals =
    typeof (data.policy as Record<string, unknown> | undefined)?.min_approvals === 'number'
      ? Number((data.policy as Record<string, unknown>).min_approvals)
      : undefined;
  const maxRejects =
    typeof (data.policy as Record<string, unknown> | undefined)?.max_rejects === 'number'
      ? Number((data.policy as Record<string, unknown>).max_rejects)
      : undefined;
  const approveCount =
    typeof data.approve_count === 'number' ? data.approve_count : Number(data.approve_count ?? 0);
  const rejectCount =
    typeof data.reject_count === 'number' ? data.reject_count : Number(data.reject_count ?? 0);
  const timeoutCount =
    typeof data.timeout_count === 'number' ? data.timeout_count : Number(data.timeout_count ?? 0);
  const uniqueApprovers = new Set(
    attestationEntries
      .filter((item) => String((item as Record<string, unknown>).verdict ?? '').toLowerCase() === 'approve')
      .map((item) => (item as Record<string, unknown>).verifier_id)
      .filter((value): value is string => typeof value === 'string')
  );
  const uniqueRejectors = new Set(
    [...shadowAttestations, ...escalationAttestations]
      .filter((item) => String((item as Record<string, unknown>).verdict ?? '').toLowerCase() === 'reject')
      .map((item) => (item as Record<string, unknown>).verifier_id)
      .filter((value): value is string => typeof value === 'string')
  );
  const finalityProof =
    typeof data.finality_proof === 'string' ? data.finality_proof : undefined;
  const finalityProofHash =
    typeof data.finality_proof_hash === 'string'
      ? data.finality_proof_hash
      : typeof finalityProof === 'string' && /^[0-9a-f]{64}$/i.test(finalityProof)
        ? finalityProof
        : undefined;
  const proofFormatValid = typeof finalityProofHash === 'string' && /^[0-9a-f]{64}$/i.test(finalityProofHash);
  const thresholdSatisfied =
    typeof data.threshold_satisfied === 'boolean'
      ? data.threshold_satisfied
      : minApprovals !== undefined
        ? approveCount >= minApprovals
        : approveCount > 0;
  const rejectsWithinPolicy = maxRejects !== undefined ? rejectCount <= maxRejects : true;

  return FinalityCertificateSchema.parse({
    proof_version: typeof data.proof_version === 'number' ? data.proof_version : undefined,
    version: typeof data.version === 'number' ? data.version : undefined,
    certificate_version:
      typeof data.certificate_version === 'number' ? data.certificate_version : undefined,
    manifest_version:
      typeof data.manifest_version === 'number' ? data.manifest_version : undefined,
    chain_id: typeof data.chain_id === 'string' ? data.chain_id : undefined,
    round_id: data.round_id ?? data.round,
    round_hash: typeof data.round_hash === 'string' ? data.round_hash : undefined,
    previous_round_hash:
      typeof data.previous_round_hash === 'string' ? data.previous_round_hash : undefined,
    block_hash: (data.block_hash ?? data.block_id ?? data.hash) as string | undefined,
    ippan_time_us: data.ippan_time_us ?? data.timestamp_us ?? data.timestamp,
    primary_id: (data.primary_id ?? data.primary_hash) as string | undefined,
    proposer_id: typeof data.proposer_id === 'string' ? data.proposer_id : undefined,
    finality_proof: finalityProof,
    finality_proof_hash: finalityProofHash,
    status: typeof data.status === 'string' ? data.status : undefined,
    shadow_attestations: shadowAttestations,
    escalation_attestations: escalationAttestations,
    attestation_entries: attestationEntries,
    policy: (data.policy ?? undefined) as FinalityPolicy | undefined,
    approve_count: approveCount,
    reject_count: rejectCount,
    timeout_count: timeoutCount,
    attestation_count:
      typeof data.attestation_count === 'number'
        ? data.attestation_count
        : attestationEntries.length,
    canonical_encoding_version:
      typeof data.canonical_encoding_version === 'number'
        ? data.canonical_encoding_version
        : undefined,
    proof_format_valid: proofFormatValid,
    threshold_satisfied: thresholdSatisfied,
    unique_approver_count: uniqueApprovers.size,
    unique_rejector_count: uniqueRejectors.size,
    proof_payload_hash:
      typeof data.proof_payload_hash === 'string' ? data.proof_payload_hash : undefined,
    certificate_payload_hash:
      typeof data.certificate_payload_hash === 'string' ? data.certificate_payload_hash : undefined,
    canonical_signed_bytes_hash:
      typeof data.canonical_signed_bytes_hash === 'string'
        ? data.canonical_signed_bytes_hash
        : undefined,
    canonical_signed_bytes_hex:
      typeof data.canonical_signed_bytes_hex === 'string'
        ? data.canonical_signed_bytes_hex
        : undefined,
    verifier_set_commitment:
      typeof data.verifier_set_commitment === 'string' ? data.verifier_set_commitment : undefined,
    verifier_set_size:
      typeof data.verifier_set_size === 'number' ? data.verifier_set_size : undefined,
    verification_facts:
      typeof data.verification_facts === 'object' && data.verification_facts
        ? data.verification_facts
        : {
            status: rejectsWithinPolicy && thresholdSatisfied && proofFormatValid ? 'pass' : 'fail',
            signatures_valid: undefined,
            threshold_satisfied: thresholdSatisfied,
            verifier_set_verified: undefined,
            tx_inclusion_verified: undefined,
            block_inclusion_verified: undefined,
            round_linkage_verified: undefined,
            authorization_verified: undefined,
            unique_approvers_enforced: uniqueApprovers.size >= approveCount,
            manifest_verified: undefined,
            replay_available: undefined,
          },
    replay_manifest:
      typeof data.replay_manifest === 'object' && data.replay_manifest
        ? data.replay_manifest
        : undefined,
  });
}

export function normalizeFinalityProofBundle(raw: unknown): FinalityProofBundle {
  const data = raw as Record<string, unknown>;
  return FinalityProofBundleSchema.parse({
    bundle_version: typeof data.bundle_version === 'number' ? data.bundle_version : undefined,
    manifest_version: typeof data.manifest_version === 'number' ? data.manifest_version : undefined,
    generated_at_us: data.generated_at_us,
    tool_version: typeof data.tool_version === 'string' ? data.tool_version : undefined,
    git_commit: typeof data.git_commit === 'string' ? data.git_commit : undefined,
    certificate: data.certificate ? normalizeFinalityCertificate(data.certificate) : undefined,
    certificate_canonical:
      typeof data.certificate_canonical === 'object' ? data.certificate_canonical : undefined,
    round_finality_payload:
      typeof data.round_finality_payload === 'object' ? data.round_finality_payload : undefined,
    round_canonical: typeof data.round_canonical === 'object' ? data.round_canonical : undefined,
    verifier_set: data.verifier_set,
    verifier_set_canonical:
      typeof data.verifier_set_canonical === 'object' ? data.verifier_set_canonical : undefined,
    round: data.round,
    block: data.block,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    verifier_version_info:
      typeof data.verifier_version_info === 'object' ? data.verifier_version_info : undefined,
    manifest: Array.isArray(data.manifest) ? data.manifest : [],
  });
}
