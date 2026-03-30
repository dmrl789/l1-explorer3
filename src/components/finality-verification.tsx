'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Clock3,
  Download,
  FileCheck,
  Link2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useFinalityCertificate, useFinalityProofBundle } from '@/lib/hooks';
import type { FinalityCertificate, FinalityProofBundle } from '@/lib/api';
import { microsToDate } from '@/lib/time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyableText } from '@/components/copy-button';
import { cn } from '@/lib/utils';

type StageState = 'complete' | 'current' | 'pending';

export interface VerificationStage {
  label: string;
  state: StageState;
  detail?: string;
  href?: string;
}

interface VerificationArtifact {
  subject: 'transaction' | 'block' | 'round';
  txHash?: string;
  blockHash?: string;
  roundId?: string | number;
  ippanTimeUs?: string | number;
  finalityStatus: string;
  verifierMetadata?: Record<string, unknown>;
  proofData?: Record<string, unknown>;
  sources?: Record<string, unknown>;
}

interface VerificationFactRow {
  label: string;
  value: boolean | undefined;
}

interface FinalityVerificationCardProps {
  title?: string;
  description: string;
  stages: VerificationStage[];
  artifact: VerificationArtifact;
  certificateBlockHash?: string;
  emptyMessage?: string;
  downloadLabel?: string;
}

export function FinalityVerificationCard({
  title = 'Finality Verification',
  description,
  stages,
  artifact,
  certificateBlockHash,
  emptyMessage = 'No live certificate is available for this record yet.',
  downloadLabel = 'Download Proof Bundle',
}: FinalityVerificationCardProps) {
  const {
    certificate,
    isLoading: certificateLoading,
  } = useFinalityCertificate(certificateBlockHash);
  const bundleKind = bundleTargetForArtifact(artifact);
  const bundleId = bundleTargetIdForArtifact(artifact, certificateBlockHash);
  const { bundle, isLoading: bundleLoading } = useFinalityProofBundle(bundleKind, bundleId);

  const effectiveStatus = certificate?.verification_facts?.status ?? certificate?.status ?? artifact.finalityStatus;
  const statusTone = getStatusTone(effectiveStatus);
  const downloadHref = bundleId
    ? `/v1/proof-bundles/${bundleKind}/${encodeURIComponent(bundleId)}`
    : null;

  const verificationFacts = buildVerificationFacts(certificate, bundle);
  const signerFingerprints = formatFingerprints(certificate);
  const replayCommands = [
    certificate?.replay_manifest?.verify_proof_bundle_command,
    certificate?.replay_manifest?.verify_certificate_command,
    certificate?.replay_manifest?.replay_round_command,
    certificate?.replay_manifest?.replay_tx_command,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('capitalize', statusTone)}>
            {effectiveStatus || 'unknown'}
          </Badge>
          <Button variant="outline" size="sm" asChild disabled={!downloadHref}>
            <a href={downloadHref ?? '#'} download>
              <Download className="h-4 w-4 mr-1" />
              {downloadLabel}
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => (
            <div
              key={stage.label}
              className={cn(
                'rounded-lg border p-3',
                stage.state === 'complete'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : stage.state === 'current'
                    ? 'border-yellow-500/20 bg-yellow-500/5'
                    : 'border-slate-700/50 bg-slate-900/30'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{stage.label}</span>
                {stage.state === 'complete' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : stage.state === 'current' ? (
                  <Clock3 className="h-4 w-4 text-yellow-400" />
                ) : (
                  <Link2 className="h-4 w-4 text-slate-500" />
                )}
              </div>
              {stage.detail ? <p className="mt-2 text-xs text-muted-foreground">{stage.detail}</p> : null}
              {stage.href ? (
                <Link href={stage.href} className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300">
                  Inspect record
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              Audit Path
            </div>
            <AuditRow label="Transaction">
              {artifact.txHash ? <CopyableText value={artifact.txHash} truncate={false} /> : 'Not attached'}
            </AuditRow>
            <AuditRow label="Block">
              {artifact.blockHash ? <CopyableText value={artifact.blockHash} truncate={false} /> : 'Not attached'}
            </AuditRow>
            <AuditRow label="Round">
              {artifact.roundId !== undefined ? `#${artifact.roundId}` : 'Not attached'}
            </AuditRow>
            <AuditRow label="IPPAN Time">{formatIppanTime(artifact.ippanTimeUs)}</AuditRow>
          </div>

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {certificateLoading || bundleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              )}
              Live Certificate
            </div>
            {certificateLoading || bundleLoading ? (
              <p className="text-sm text-muted-foreground">Loading latest certificate state…</p>
            ) : certificate ? (
              <>
                <AuditRow label="Certificate Status">{certificate.status ?? 'unknown'}</AuditRow>
                <AuditRow label="Proof Version">
                  {certificate.proof_version ?? certificate.certificate_version ?? 'Unavailable'}
                </AuditRow>
                <AuditRow label="Approvals">
                  {certificate.approve_count ?? 0} / {certificate.policy?.min_approvals ?? '—'}
                </AuditRow>
                <AuditRow label="Rejects">{certificate.reject_count ?? 0}</AuditRow>
                <AuditRow label="Timeouts">{certificate.timeout_count ?? 0}</AuditRow>
                <AuditRow label="Unique Signers">
                  {certificate.unique_approver_count ?? 0} approvers · {certificate.unique_rejector_count ?? 0} rejectors
                </AuditRow>
                <AuditRow label="Proof Format">
                  {certificate.proof_format_valid ? 'Valid 64-hex proof' : 'Proof missing or malformed'}
                </AuditRow>
                <AuditRow label="Threshold Check">
                  {certificate.threshold_satisfied ? 'Policy satisfied' : 'Threshold not satisfied'}
                </AuditRow>
                <AuditRow label="Finality Proof Hash">
                  {certificate.finality_proof_hash ?? certificate.finality_proof ? (
                    <CopyableText
                      value={certificate.finality_proof_hash ?? certificate.finality_proof ?? ''}
                      truncate={false}
                    />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Proof Payload Hash">
                  {certificate.proof_payload_hash ? (
                    <CopyableText value={certificate.proof_payload_hash} truncate={false} />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Certificate Payload Hash">
                  {certificate.certificate_payload_hash ? (
                    <CopyableText value={certificate.certificate_payload_hash} truncate={false} />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Canonical Encoding">
                  {certificate.canonical_encoding_version ?? 'Unavailable'}
                </AuditRow>
                <AuditRow label="Canonical Hash">
                  {certificate.canonical_signed_bytes_hash ? (
                    <CopyableText value={certificate.canonical_signed_bytes_hash} truncate={false} />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Round Hash">
                  {certificate.round_hash ? (
                    <CopyableText value={certificate.round_hash} truncate={false} />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Previous Round Hash">
                  {certificate.previous_round_hash ? (
                    <CopyableText value={certificate.previous_round_hash} truncate={false} />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Verifier Set">
                  {certificate.verifier_set_commitment
                    ? `${bundle?.verifier_set?.roster_size ?? certificate.verifier_set_size ?? 0} rostered`
                    : 'Unavailable'}
                </AuditRow>
                <AuditRow label="Verifier Set Commitment">
                  {certificate.verifier_set_commitment ? (
                    <CopyableText value={certificate.verifier_set_commitment} truncate={false} />
                  ) : (
                    'Unavailable'
                  )}
                </AuditRow>
                <AuditRow label="Signed Attestations">{countSignedAttestations(bundle)}</AuditRow>
                <AuditRow label="Attestation Count">
                  {certificate.attestation_count ?? certificate.attestation_entries?.length ?? 0}
                </AuditRow>
                <AuditRow label="Signer Fingerprints">
                  {signerFingerprints.length ? signerFingerprints.join(', ') : 'Unavailable'}
                </AuditRow>
                <AuditRow label="Policy">
                  {certificate.policy
                    ? `${certificate.policy.min_approvals ?? '—'} approvals, ${certificate.policy.max_rejects ?? '—'} rejects max`
                    : 'Policy unavailable'}
                </AuditRow>
                {verificationFacts.length > 0 ? (
                  <div className="space-y-2 border-t border-slate-700/50 pt-3">
                    <div className="text-sm font-medium">Verification Facts</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {verificationFacts.map((fact) => (
                        <AuditRow key={fact.label} label={fact.label}>
                          {booleanFact(fact.value)}
                        </AuditRow>
                      ))}
                    </div>
                  </div>
                ) : null}
                {replayCommands.length > 0 ? (
                  <div className="space-y-2 border-t border-slate-700/50 pt-3">
                    <div className="text-sm font-medium">Offline Verification</div>
                    {replayCommands.map((command) => (
                      <div key={command} className="rounded-md bg-slate-950/60 p-2 text-xs text-slate-200">
                        <CopyableText value={command} truncate={false} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinalityCertificateButton({
  blockHash,
  artifact,
  label = 'Download Proof Bundle',
}: {
  blockHash: string;
  artifact: VerificationArtifact;
  label?: string;
}) {
  const bundleKind = bundleTargetForArtifact(artifact);
  const bundleId = bundleTargetIdForArtifact(artifact, blockHash);
  const downloadHref = bundleId
    ? `/v1/proof-bundles/${bundleKind}/${encodeURIComponent(bundleId)}`
    : null;

  return (
    <Button variant="outline" size="sm" asChild disabled={!downloadHref}>
      <a href={downloadHref ?? '#'} download>
        <Download className="h-4 w-4 mr-1" />
        {label}
      </a>
    </Button>
  );
}

function AuditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right text-sm font-medium">{children}</div>
    </div>
  );
}

function formatIppanTime(value: string | number | undefined) {
  if (value === undefined) return 'Unavailable';
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized)) return String(value);
  return microsToDate(normalized)?.toLocaleString() ?? String(value);
}

function getStatusTone(status: string | undefined) {
  const normalized = status?.toLowerCase();
  if (normalized === 'pass' || normalized?.includes('final')) {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }
  if (normalized?.includes('prov') || normalized?.includes('progress') || normalized?.includes('include')) {
    return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300';
  }
  if (normalized === 'fail') {
    return 'border-red-500/20 bg-red-500/10 text-red-300';
  }
  return 'border-slate-600 bg-slate-800 text-slate-300';
}

function countSignedAttestations(bundle: FinalityProofBundle | null) {
  const entries = bundle?.certificate?.attestation_entries ?? bundle?.certificate?.shadow_attestations;
  if (!entries?.length) return 'Unavailable';
  const signed = entries.filter((entry) => typeof entry.signature_hex === 'string').length;
  return `${signed} signed / ${entries.length} total`;
}

function bundleTargetForArtifact(artifact: VerificationArtifact): 'block' | 'tx' {
  if (artifact.subject === 'transaction' && artifact.txHash) return 'tx';
  return 'block';
}

function bundleTargetIdForArtifact(
  artifact: VerificationArtifact,
  certificateBlockHash: string | undefined
): string | undefined {
  if (artifact.subject === 'transaction' && artifact.txHash) return artifact.txHash;
  return certificateBlockHash ?? artifact.blockHash;
}

function buildVerificationFacts(
  certificate: FinalityCertificate | null,
  bundle: FinalityProofBundle | null
): VerificationFactRow[] {
  const facts = certificate?.verification_facts;
  if (!facts) return [];
  return [
    { label: 'Signatures Valid', value: facts.signatures_valid },
    { label: 'Authorization Verified', value: facts.authorization_verified },
    { label: 'Verifier Set Verified', value: facts.verifier_set_verified },
    { label: 'Unique Approvers Enforced', value: facts.unique_approvers_enforced },
    { label: 'TX Inclusion Verified', value: facts.tx_inclusion_verified },
    { label: 'Block Inclusion Verified', value: facts.block_inclusion_verified },
    { label: 'Round Linkage Verified', value: facts.round_linkage_verified },
    { label: 'Manifest Verified', value: facts.manifest_verified ?? (bundle?.manifest?.length ? true : undefined) },
    { label: 'Replay Available', value: facts.replay_available },
  ].filter((fact) => fact.value !== undefined);
}

function booleanFact(value: boolean | undefined) {
  if (value === undefined) return 'Unavailable';
  return value ? 'true' : 'false';
}

function formatFingerprints(certificate: FinalityCertificate | null) {
  const entries = certificate?.attestation_entries ?? certificate?.shadow_attestations ?? [];
  return Array.from(
    new Set(
      entries
        .map((entry) => entry.public_key_fingerprint_hex)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );
}
