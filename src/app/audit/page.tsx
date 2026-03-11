'use client';

import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Database,
  Lock,
  FileCheck,
  Hash,
  Layers,
} from 'lucide-react';
import {
  useProofFinality,
  useProofDlcFinality,
  useProofPerf,
  useRounds,
  useStatus,
} from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageSkeleton, TableSkeleton } from '@/components/skeletons';
import { CopyableText } from '@/components/copy-button';
import { ProofBadge } from '@/components/proof-panel';
import { cn } from '@/lib/utils';

export default function AuditPage() {
  const { proof: finalityProof, isLoading: finalityLoading, refresh: refreshFinality } = useProofFinality();
  const { proof: dlcFinality, refresh: refreshDlc } = useProofDlcFinality();
  const { proof: perfProof } = useProofPerf();
  const { rounds, isLoading: roundsLoading } = useRounds(20);
  const { status } = useStatus();

  if (finalityLoading && !finalityProof) {
    return <PageSkeleton />;
  }

  const refreshAll = () => {
    refreshFinality();
    refreshDlc();
  };

  // Determine overall integrity status
  const dualConsistent = dlcFinality?.dual
    ? dlcFinality.dual.consensus_finalized_txs_total === dlcFinality.dual.durable_finalized_txs_total
    : false;
  const hasFinality = (finalityProof?.finalized_rounds_total ?? 0) > 0;
  const isDurable = perfProof?.commit_mode === 'durable';
  const zeroWriteErrors = (dlcFinality?.async_writer?.write_errors ?? 0) === 0;
  const overallPass = hasFinality && dualConsistent && isDurable && zeroWriteErrors;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finality & Replayability</h1>
          <p className="text-muted-foreground mt-1">
            Cryptographic finality certificates, hash-chain integrity, and deterministic replay proof
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Integrity Status */}
      <Card className={cn(
        'relative overflow-hidden',
        overallPass ? 'bg-emerald-500/5' : 'bg-yellow-500/5'
      )}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'rounded-full p-4',
                overallPass ? 'bg-emerald-500/10' : 'bg-yellow-500/10'
              )}>
                {overallPass ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Chain Integrity</h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      overallPass ? 'text-emerald-400 border-emerald-400' : 'text-yellow-400 border-yellow-400'
                    )}
                  >
                    {overallPass ? 'VERIFIED' : 'PARTIAL'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {overallPass
                    ? 'DLC finality, durable persistence, and dual consistency all verified'
                    : 'Some verification checks pending or unavailable'}
                </p>
              </div>
            </div>

            {finalityProof && (
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {finalityProof.finalized_rounds_total.toLocaleString()} finalized rounds
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {finalityProof.finalized_txs_total.toLocaleString()} finalized txs
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Checks */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <VerifyCard
          label="DLC Finality"
          pass={hasFinality}
          detail={hasFinality ? `${finalityProof?.finalized_rounds_total} rounds` : 'No finality'}
        />
        <VerifyCard
          label="Dual Consistency"
          pass={dualConsistent}
          detail={dualConsistent ? 'Consensus = Durable' : 'Mismatch or unavailable'}
        />
        <VerifyCard
          label="Durable Persistence"
          pass={isDurable}
          detail={isDurable ? `fsync every ${perfProof?.fsync_every_n_rounds ?? 1} round` : 'Not durable'}
        />
        <VerifyCard
          label="Zero Write Errors"
          pass={zeroWriteErrors}
          detail={zeroWriteErrors ? `${dlcFinality?.async_writer?.records_written ?? 0} records clean` : 'Write errors detected'}
        />
      </div>

      {/* Finality Commitments from DLC */}
      {dlcFinality && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              DLC Finality Commitment
            </CardTitle>
            <CardDescription>
              Finality attestation from DLC consensus engine — the canonical source of truth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <CommitItem label="Node ID" value={dlcFinality.node_id} />
              <CommitItem label="Chain ID" value={String(dlcFinality.chain_id)} />
              <CommitItem label="Last Finalized Round" value={`#${dlcFinality.finalized_round}`} />
              <CommitItem label="Total Finalized Rounds" value={Number(dlcFinality.finalized_rounds_total).toLocaleString()} />
              <CommitItem label="Total Finalized Blocklets" value={Number(dlcFinality.finalized_blocklets_total).toLocaleString()} />
              <CommitItem label="Total Finalized Txs" value={Number(dlcFinality.finalized_txs_total).toLocaleString()} />
              <CommitItem label="Total Finalized Bytes" value={formatBytes(Number(dlcFinality.finalized_bytes_total))} />
              {dlcFinality.timestamp_unix_ms && (
                <CommitItem label="Timestamp" value={new Date(Number(dlcFinality.timestamp_unix_ms)).toISOString()} />
              )}
            </div>

            {/* Commit Latency */}
            {dlcFinality.commit_us && (
              <>
                <div className="mt-4 space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Commit Latency (fsync)</span>
                  <div className="grid gap-3 md:grid-cols-5">
                    <LatencyStat label="Commits" value={dlcFinality.commit_us.count.toLocaleString()} />
                    <LatencyStat label="Min" value={`${(dlcFinality.commit_us.min_us / 1000).toFixed(2)}ms`} />
                    <LatencyStat label="p50" value={`${(dlcFinality.commit_us.p50_us / 1000).toFixed(2)}ms`} />
                    <LatencyStat label="p95" value={`${(dlcFinality.commit_us.p95_us / 1000).toFixed(2)}ms`} />
                    <LatencyStat label="Max" value={`${(dlcFinality.commit_us.max_us / 1000).toFixed(2)}ms`} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finalized Rounds — Hash Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Finalized Rounds — Hash Chain
          </CardTitle>
          <CardDescription>
            Each round links to its predecessor via prev_round_hash, forming an immutable chain.
            State roots commit to the full ledger state at each round boundary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roundsLoading && (!rounds || rounds.length === 0) ? (
            <TableSkeleton rows={5} columns={5} />
          ) : !rounds || rounds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No finalized rounds available yet
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Round Hash</TableHead>
                    <TableHead>State Root</TableHead>
                    <TableHead className="text-right">Blocks</TableHead>
                    <TableHead className="text-right">Txs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rounds.map((round) => (
                    <TableRow key={String(round.round_id)}>
                      <TableCell>
                        <Link
                          href={`/rounds/${round.round_id}`}
                          className="font-mono font-medium hover:text-emerald-400 transition-colors"
                        >
                          #{round.round_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={round.status === 'finalized' ? 'default' : 'outline'}
                          className={round.status === 'finalized' ? '' : 'text-yellow-400'}
                        >
                          {round.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {round.hashtimer ? (
                          <CopyableText value={round.hashtimer} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground font-mono text-xs">—</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {round.block_count ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {round.tx_count ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Why Replayability Matters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Why This Proves Integrity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <h3 className="font-medium text-sm">Hash-Chained Finality</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Every round references its predecessor&apos;s hash. Tampering with any
                round invalidates all subsequent hashes — providing immutable audit trail.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <h3 className="font-medium text-sm">Durable Persistence</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Every finalized round is fsync&apos;d to disk before acknowledgment.
                Dual consistency proof verifies consensus and storage agree exactly.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="font-medium text-sm">Deterministic Replay</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                HashTimer ordering ensures every transaction has a unique, deterministic
                position. Same inputs always produce same outputs — no execution ambiguity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Helper Components ---

function VerifyCard({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {pass ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-medium text-sm">{label}</div>
            <p className="text-xs text-muted-foreground mt-1">{detail}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-medium">{value}</span>
    </div>
  );
}

function LatencyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-slate-800/30">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-sm font-mono font-medium mt-1">{value}</div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
