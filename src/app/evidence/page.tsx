'use client';

import {
  GitCommit,
  Settings,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  FileText,
  Cpu,
  Database,
  Zap,
  Server,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  useStatus,
  useProofBuild,
  useProofPipeline,
  useProofPerf,
  useProofDlcFinality,
  useProofSizing,
} from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/skeletons';
import { CopyButton } from '@/components/copy-button';
import { ProofBadge } from '@/components/proof-panel';
import { cn } from '@/lib/utils';

export default function EvidencePage() {
  const { status, isLoading: statusLoading } = useStatus();
  const { proof: buildProof } = useProofBuild();
  const { proof: pipelineProof, refresh: refreshPipeline } = useProofPipeline();
  const { proof: perfProof, refresh: refreshPerf } = useProofPerf();
  const { proof: dlcFinality, refresh: refreshDlc } = useProofDlcFinality();
  const { proof: sizingProof } = useProofSizing();

  if (statusLoading && !status) {
    return <PageSkeleton />;
  }

  const roundTickMs = sizingProof?.round_tick_us
    ? sizingProof.round_tick_us / 1000
    : null;

  const refreshAll = () => {
    refreshPipeline();
    refreshPerf();
    refreshDlc();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DevNet Evidence</h1>
          <p className="text-muted-foreground mt-1">
            Live proof of DLC BlockDAG operation with continuous blocklets and D-GBDT fairness
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* 9M TPS Breakthrough Banner */}
      <Link href="/evidence/9m-tps" className="block group">
        <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5 hover:border-emerald-500/50 transition-colors">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">8.85 Million Finalized TPS</span>
                <Badge variant="success">VERIFIED</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Cross-continent DLC benchmark — Detroit to Falkenstein, 106ms RTT. View full evidence, hardware topology, and downloadable proof bundles.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-400 transition-colors shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Build & Consensus Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            Build & Consensus Proof
          </CardTitle>
          <CardDescription>
            Binary attestation — proves which consensus engine is compiled and active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Consensus Mode</span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-sm">
                  {buildProof?.consensus_mode_effective ?? 'DLC'}
                </Badge>
                {buildProof?.consensus_mode_effective === 'DLC' && (
                  <span className="text-xs text-emerald-400">+ D-GBDT</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Version</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg font-medium">
                  {buildProof?.git_sha ?? status?.version ?? '—'}
                </code>
                {buildProof?.git_sha && <CopyButton value={buildProof.git_sha} />}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Build Profile</span>
              <div className="text-lg font-medium">
                {buildProof?.build_profile ?? '—'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Node</span>
              <div className="text-lg font-medium">
                {buildProof?.node_id ?? status?.network_name ?? '—'}
              </div>
            </div>
          </div>

          {/* Compiled Modules */}
          {buildProof && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-3">
                <CompileFlag label="DLC Engine" compiled={buildProof.dlc_compiled} />
                <CompileFlag label="Stage2b Pipeline" compiled={buildProof.stage2b_compiled} />
                <CompileFlag label="Dispatchers" compiled={(buildProof.dispatchers_configured ?? 0) > 0} value={String(buildProof.dispatchers_configured ?? 0)} />
              </div>
            </>
          )}

          {/* Active Env Flags */}
          {buildProof?.active_env_flags && buildProof.active_env_flags.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Active Environment Flags</span>
                <div className="flex flex-wrap gap-2">
                  {buildProof.active_env_flags.map((flag) => (
                    <code key={flag} className="text-xs px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50 text-slate-300">
                      {flag}
                    </code>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DLC Finality Certificate */}
      {dlcFinality && (
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              DLC Finality Certificate
            </CardTitle>
            <CardDescription>
              Cryptographic proof of DLC consensus finality — hash-chained, durable, fsync&apos;d
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricItem
                label="Finalized Round"
                value={`#${dlcFinality.finalized_round}`}
              />
              <MetricItem
                label="Finalized Rounds"
                value={Number(dlcFinality.finalized_rounds_total).toLocaleString()}
              />
              <MetricItem
                label="Finalized Transactions"
                value={Number(dlcFinality.finalized_txs_total).toLocaleString()}
              />
              <MetricItem
                label="Finalized Bytes"
                value={formatBytes(Number(dlcFinality.finalized_bytes_total))}
              />
            </div>

            <Separator className="my-4" />

            {/* Finality Lag */}
            {dlcFinality.lag_us && (
              <div className="space-y-3">
                <span className="text-sm font-medium text-muted-foreground">Finality Lag (microseconds)</span>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <LatencyStat label="Samples" value={dlcFinality.lag_us.count.toLocaleString()} />
                  <LatencyStat label="Min" value={`${(dlcFinality.lag_us.min_us / 1000).toFixed(1)}ms`} />
                  <LatencyStat label="p50" value={`${(dlcFinality.lag_us.p50_us / 1000).toFixed(1)}ms`} />
                  <LatencyStat label="p95" value={`${(dlcFinality.lag_us.p95_us / 1000).toFixed(1)}ms`} />
                  <LatencyStat label="p99" value={`${(dlcFinality.lag_us.p99_us / 1000).toFixed(1)}ms`} />
                  <LatencyStat label="Max" value={`${(dlcFinality.lag_us.max_us / 1000).toFixed(1)}ms`} />
                </div>
              </div>
            )}

            {/* Dual Consistency */}
            {dlcFinality.dual && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <span className="text-sm font-medium text-muted-foreground">Dual Consistency Proof</span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-sm">Consensus Finalized</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {dlcFinality.dual.consensus_finalized_rounds_total} rounds / {dlcFinality.dual.consensus_finalized_txs_total.toLocaleString()} txs
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-sm">Durable Finalized</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {dlcFinality.dual.durable_finalized_rounds_total} rounds / {dlcFinality.dual.durable_finalized_txs_total.toLocaleString()} txs
                        </span>
                        {dlcFinality.dual.consensus_finalized_txs_total === dlcFinality.dual.durable_finalized_txs_total ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  {dlcFinality.dual.consensus_finalized_txs_total === dlcFinality.dual.durable_finalized_txs_total && (
                    <p className="text-xs text-emerald-400">
                      Consensus and durable finality are in exact agreement — zero data loss
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Async Writer */}
            {dlcFinality.async_writer && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Async Writer:</span>
                    <ProofBadge status={dlcFinality.async_writer.enabled ? 'pass' : 'fail'} label={dlcFinality.async_writer.enabled ? 'ENABLED' : 'DISABLED'} />
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Records Written: </span>
                    <span className="font-mono font-medium">{dlcFinality.async_writer.records_written}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Write Errors: </span>
                    <span className={cn('font-mono font-medium', dlcFinality.async_writer.write_errors === 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {dlcFinality.async_writer.write_errors}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pipeline Throughput */}
      {pipelineProof && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Transaction Pipeline Proof
            </CardTitle>
          <CardDescription>
            End-to-end transaction processing — RPC ingress through continuous blocklet production into 250 ms DLC round finality
          </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <PipelineStat label="Received" value={pipelineProof.http_received_txs_total} />
              <PipelineStat label="Admitted" value={pipelineProof.admission_admitted_total} />
              <PipelineStat label="Executed" value={pipelineProof.executed_ok_txs_total} />
              <PipelineStat label="Finalized" value={pipelineProof.finalized_txs_total} />
            </div>

            <Separator className="my-4" />

            {/* Error Counters */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-muted-foreground">Error Counters</span>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                <ErrorCounter label="Denied" value={pipelineProof.admission_denied_total} />
                <ErrorCounter label="Rate Limited" value={pipelineProof.deny_rate_limit_total} />
                <ErrorCounter label="Duplicate Hash" value={pipelineProof.deny_duplicate_hash_total} />
                <ErrorCounter label="Invalid Sig" value={pipelineProof.deny_invalid_signature_total} />
                <ErrorCounter label="Execution Errors" value={pipelineProof.executed_err_txs_total} />
              </div>
            </div>

            {/* Group Distribution */}
            {pipelineProof.blocklets_produced_per_group_total && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Blocklet Distribution Across 16 Groups
                  </span>
                  <div className="grid grid-cols-8 gap-1">
                    {pipelineProof.blocklets_produced_per_group_total.map((count, i) => (
                      <div key={i} className="text-center p-2 rounded bg-slate-800/30 border border-slate-700/30">
                        <div className="text-[10px] text-slate-500">G{i}</div>
                        <div className="text-xs font-mono font-medium">{Number(count)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Proof */}
      {perfProof && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Performance Proof
            </CardTitle>
          <CardDescription>
            Stage2b pipeline timing, continuous blocklet production, storage durability, and 250 ms round assembly metrics
          </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricItem
                label="Round Tick"
                value={roundTickMs ? `${roundTickMs}ms` : '—'}
                sublabel={roundTickMs === 250 ? 'DLC canonical' : undefined}
              />
              <MetricItem
                label="Commit Mode"
                value={perfProof.commit_mode?.toUpperCase() ?? '—'}
                sublabel={perfProof.fsync_every_n_rounds ? `fsync every ${perfProof.fsync_every_n_rounds} round` : undefined}
              />
              <MetricItem
                label="Shadow Mode"
                value={perfProof.shadow_mode?.toUpperCase() ?? '—'}
              />
              <MetricItem
                label="Rounds Assembled"
                value={perfProof.stage2b?.rounds_assembled_total?.toLocaleString() ?? '—'}
              />
            </div>

            {/* Stage2b Detailed */}
            {perfProof.stage2b && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <span className="text-sm font-medium text-muted-foreground">Stage2b Microbenchmarks (p95)</span>
                  <div className="grid gap-4 md:grid-cols-3">
                    {perfProof.stage2b.micros_p95 && (
                      <>
                        <MicrobenchItem label="Blocklet Build" value={`${perfProof.stage2b.micros_p95.build}us`} />
                        <MicrobenchItem label="Round Assemble" value={`${perfProof.stage2b.micros_p95.assemble}us`} />
                        <MicrobenchItem label="Round Commit" value={`${perfProof.stage2b.micros_p95.commit}us`} />
                      </>
                    )}
                  </div>
                </div>

                {perfProof.stage2b.lag_ms && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-muted-foreground">Inclusion Lag</span>
                      <div className="grid gap-4 md:grid-cols-2">
                        <LatencyStat label="p50" value={`${perfProof.stage2b.lag_ms.p50}ms`} />
                        <LatencyStat label="p95" value={`${perfProof.stage2b.lag_ms.p95}ms`} />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Storage */}
            {perfProof.storage && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <span className="text-sm font-medium text-muted-foreground">Storage Durability</span>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-sm text-muted-foreground">fsync calls</span>
                      <span className="font-mono text-sm font-medium">{perfProof.storage.fsync_calls_total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-sm text-muted-foreground">WAL appends</span>
                      <span className="font-mono text-sm font-medium">{perfProof.storage.wal_appends_total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-sm text-muted-foreground">Total fsync time</span>
                      <span className="font-mono text-sm font-medium">
                        {perfProof.storage.fsync_us_total ? `${(perfProof.storage.fsync_us_total / 1000).toFixed(1)}ms` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Consensus Engine</span>
              <ProofBadge
                status={buildProof?.consensus_mode_effective === 'DLC' ? 'pass' : 'fail'}
                label={buildProof?.consensus_mode_effective ?? 'UNKNOWN'}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Deterministic Ordering</span>
              <ProofBadge
                status={status?.deterministic_ordering ? 'pass' : 'fail'}
                label={status?.deterministic_ordering ? 'ON' : 'OFF'}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">HashTimer</span>
              <ProofBadge
                status={status?.hashtimer_ordering === 'canonical' ? 'pass' :
                        status?.hashtimer_ordering === 'partial' ? 'running' : 'fail'}
                label={status?.hashtimer_ordering?.toUpperCase() ?? 'UNKNOWN'}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Durable Persistence</span>
              <ProofBadge
                status={perfProof?.commit_mode === 'durable' ? 'pass' : 'fail'}
                label={perfProof?.commit_mode?.toUpperCase() ?? 'UNKNOWN'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            DevNet Configuration
          </CardTitle>
          <CardDescription>
            Architecture: DLC BlockDAG with D-GBDT fairness, 16 groups / 256 lanes, continuous blocklets, and CPU-only verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ConfigItem label="Consensus" value="DLC + D-GBDT Fairness" />
            <ConfigItem label="BlockDAG Mode" value="Continuous Blocklets" />
            <ConfigItem label="Round Finality" value={roundTickMs ? `${roundTickMs}ms` : '250ms'} />
            <ConfigItem label="Groups" value="16" />
            <ConfigItem label="Lanes" value="256" />
            <ConfigItem label="Signature Verify" value="CPU Batch (ed25519_dalek)" />
            <ConfigItem label="Lane Assignment" value="BLAKE3 HashTimer" />
            <ConfigItem label="Persistence" value="Sled DB + fsync" />
            <ConfigItem label="Finality Receipts" value="Hash-chained JSONL" />
          </div>
        </CardContent>
      </Card>

      {/* Known Limitations */}
      <Card className="border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Known Limitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>Development Network:</strong> This is a 4-node DevNet for testing and demonstration.
                Not intended for production use.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>D-GBDT Model:</strong> Runtime now requires the real trained model data.
                Stub fallback is not allowed in production paths.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>CPU-Only:</strong> All signature verification is CPU-batched (no GPU).
                Throughput is bounded by CPU core count.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>Data Persistence:</strong> DevNet may be reset periodically.
                Historical data is not guaranteed to persist across resets.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/evidence/9m-tps"
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border',
                'hover:bg-accent hover:border-accent-foreground/20 transition-colors',
                'group border-emerald-500/20'
              )}
            >
              <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium">9M TPS Breakthrough</span>
                </div>
                <p className="text-sm text-muted-foreground">Full evidence: metrics, topology, proof bundles</p>
              </div>
            </Link>
            <ResourceLink
              icon={<FileText className="h-5 w-5" />}
              title="Finality & Status KPIs"
              description="What the dashboard fields prove"
              href="https://github.com/dmrl789/l1-explorer3/blob/main/docs/finality-and-status-kpis.md"
            />
            <ResourceLink
              icon={<FileText className="h-5 w-5" />}
              title="Whitepaper"
              description="Technical overview of IPPAN L1"
              href="https://ippan.uk/whitepaper"
            />
            <ResourceLink
              icon={<BookOpen className="h-5 w-5" />}
              title="Documentation"
              description="API reference and guides"
              href="https://docs.ippan.uk"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Helper Components ---

function MetricItem({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-2xl font-bold">{value}</div>
      {sublabel && <span className="text-xs text-emerald-400">{sublabel}</span>}
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
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

function PipelineStat({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-2xl font-bold font-mono">{Number(value ?? 0).toLocaleString()}</div>
    </div>
  );
}

function ErrorCounter({ label, value }: { label: string; value: string | number | undefined }) {
  const num = Number(value ?? 0);
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('font-mono text-sm font-medium', num === 0 ? 'text-emerald-400' : 'text-red-400')}>
        {num}
      </span>
    </div>
  );
}

function CompileFlag({ label, compiled, value }: { label: string; compiled?: boolean; value?: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
      compiled ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-slate-700/50 bg-slate-800/30 text-slate-500'
    )}>
      {compiled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      <span>{label}</span>
      {value && <span className="font-mono text-xs">({value})</span>}
    </div>
  );
}

function MicrobenchItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-medium text-emerald-400">{value}</span>
    </div>
  );
}

function ResourceLink({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        'hover:bg-accent hover:border-accent-foreground/20 transition-colors',
        'group'
      )}
    >
      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium">{title}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </a>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
