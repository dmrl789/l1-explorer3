'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Globe,
  Cpu,
  Server,
  CheckCircle2,
  Download,
  GitCommit,
  Clock,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/copy-button';
import { ProofBadge } from '@/components/proof-panel';
import { cn } from '@/lib/utils';

/* ── Static benchmark data (2026-02-15 run) ───────────────────────── */

const RUN_DATE = '2026-02-15';
const GIT_COMMIT = '6dc3418';
const GIT_BRANCH = 'perf/phase30-hashtimer-lanes-deploy';
const BUNDLE_SHA256 = 'e9f4fdaf237238d1b0198e48dc4200512076da77669bcae94c6ce1c899d67a49';
const GITHUB_RELEASE_URL = 'https://github.com/dmrl789/ippan/releases/tag/9m-finality-proof';

const METRICS = {
  peakTps: '8,850,348',
  totalFinalized: '29,046,070',
  dlcRounds: 69,
  avgTxsPerRound: '421,102',
  cadenceTps: '1,684,406',
  rttMs: 106,
  gpuVerified: '29,046,070',
  commitLatencyMin: '551 \u03bcs',
  commitLatencyMean: '1,323 \u03bcs',
  finalizationPct: '100%',
  attestThreshold: '2-of-3',
  lanes: 256,
  groups: 16,
  roundTickMs: 250,
};

const TOP_SECONDS = ['8.85M', '4.09M', '2.72M', '2.04M', '1.59M'];

const TOP_RECEIPTS = [
  { round: 19354, txs: '2,724,566', latency: '701 \u03bcs' },
  { round: 19353, txs: '1,814,742', latency: '1,001 \u03bcs' },
  { round: 19355, txs: '1,361,911', latency: '632 \u03bcs' },
];

const PIPELINE_STEPS = [
  { step: 1, name: 'RPC Ingestion', detail: '10 loadgen instances over 100G InfiniBand', location: 'DetA \u2192 DetB' },
  { step: 2, name: 'GPU Ed25519 Verify', detail: 'NVIDIA H100 CUDA kernel (integer-only)', location: 'DetB' },
  { step: 3, name: 'Stage2B Routing', detail: '128 builders (16 groups \u00d7 8)', location: 'DetB' },
  { step: 4, name: 'Blocklet Production', detail: 'Continuous, tick + size-driven', location: 'DetB' },
  { step: 5, name: 'Round Assembly', detail: '250ms tick (4 rounds/sec)', location: 'DetB' },
  { step: 6, name: 'DLC Consensus', detail: 'Proposer + 3 remote shadow verifiers', location: 'DetB \u2194 Falkenstein (106ms RTT)' },
  { step: 7, name: 'Durable Persist', detail: 'fsync receipts + metrics to disk', location: 'DetB' },
];

const HARDWARE = [
  { name: 'DetB (Proposer)', location: 'Detroit, USA', specs: 'AMD EPYC 9534 (256 threads), 1.5TB RAM, NVIDIA H100 NVL 96GB', role: 'Proposer + GPU verify', ip: '38.127.60.227' },
  { name: 'DetA (Load Gen)', location: 'Detroit, USA', specs: 'AMD EPYC 9534 (256 threads), 1.5TB RAM', role: '10x parallel replay', ip: '' },
  { name: 'Falkenstein (3x Shadow)', location: 'Falkenstein, Germany', specs: '32 cores, 125GB RAM', role: '3 shadow verifiers (:18180-82)', ip: '136.243.59.218' },
];

const PHASES = [
  { label: 'Phase 4', value: '16M', desc: 'Verified TPS' },
  { label: 'Phase 5', value: '36M', desc: 'Absolute ceiling' },
  { label: 'Phase 6', value: '62M', desc: 'Hardware ceiling' },
  { label: 'Phase 7', value: '118M', desc: 'Verified TPS' },
  { label: 'Final', value: '8.85M', desc: 'Durably finalized', highlight: true },
];

const SUCCESS_CRITERIA = [
  { criterion: 'Peak durable finalized TPS > 2,000,000', result: 'PASS: 8,850,348' },
  { criterion: '100% finalization completeness', result: 'PASS: 29,046,070 = 29,046,070' },
  { criterion: 'GPU Ed25519 only, zero CPU fallback', result: 'PASS' },
  { criterion: 'DLC with geographically remote verifiers', result: 'PASS: Falkenstein, 106ms RTT' },
  { criterion: 'Shadow attestation evidence included', result: 'PASS' },
  { criterion: 'Chain-linked finality receipts', result: 'PASS: 69 receipts verified' },
  { criterion: 'tps_persist.csv present', result: 'PASS' },
];

/* ── Page ──────────────────────────────────────────────────────────── */

export default function NineMillionTpsPage() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/evidence"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Evidence
      </Link>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 p-6 md:p-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">VERIFIED</Badge>
            <Badge variant="outline">{RUN_DATE}</Badge>
            <Badge variant="outline">Git: {GIT_COMMIT}</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            8.85 Million{' '}
            <span className="text-emerald-400">Finalized TPS</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Cross-continent DLC consensus between Detroit (USA) and Falkenstein (Germany)
            over the public internet with 106ms round-trip latency.
            All 29 million transactions GPU-verified and durably persisted.
          </p>
        </div>
      </div>

      {/* ── Key Metrics ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Key Metrics
          </CardTitle>
          <CardDescription>Peak 1-second window from run {GIT_COMMIT}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            <MetricBox label="Peak Finalized TPS" value={METRICS.peakTps} accent />
            <MetricBox label="Total Finalized Txs" value={METRICS.totalFinalized} />
            <MetricBox label="DLC Rounds" value={METRICS.dlcRounds.toString()} sub="100% approved" />
            <MetricBox label="Network RTT" value={`${METRICS.rttMs}ms`} sub="Detroit \u2194 Falkenstein" />
          </div>
          <Separator className="my-4" />
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            <MetricBox label="GPU Signatures Verified" value={METRICS.gpuVerified} sub="NVIDIA H100, zero CPU" />
            <MetricBox label="Finalization" value={METRICS.finalizationPct} sub="Complete" />
            <MetricBox label="Commit Latency (min)" value={METRICS.commitLatencyMin} />
            <MetricBox label="Commit Latency (mean)" value={METRICS.commitLatencyMean} />
          </div>
          <Separator className="my-4" />
          <div>
            <span className="text-sm text-muted-foreground">Top 5 peak seconds (TPS):</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {TOP_SECONDS.map((v, i) => (
                <Badge key={i} variant={i === 0 ? 'default' : 'secondary'}>{v}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Global Topology ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Topology
          </CardTitle>
          <CardDescription>
            Cross-continent consensus — NOT loopback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs md:text-sm overflow-x-auto whitespace-pre leading-relaxed">
{`    DETROIT (USA)                              FALKENSTEIN (Germany)
   ┌─────────────────┐                       ┌──────────────────────┐
   │  DetA (loadgen)  │                       │   Shadow Verifier 1  │
   │  10 × replay     │                       │   :18180             │
   │  29M presigned   │                       │                      │
   └────────┬─────────┘                       │   Shadow Verifier 2  │
            │ 100G InfiniBand                 │   :18181             │
            v                                 │                      │
   ┌─────────────────┐     106ms RTT          │   Shadow Verifier 3  │
   │  DetB (proposer) │ ◄───────────────────► │   :18182             │
   │  H100 GPU verify │     Internet          │                      │
   │  DLC consensus   │                       │   136.243.59.218     │
   │  38.127.60.227   │                       │   32 cores, 125GB    │
   └─────────────────┘                       └──────────────────────┘`}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Shadow verifiers run on a physically separate machine in Falkenstein (Hetzner datacenter, Germany),
            accessed over the public internet with 106ms round-trip latency from the Detroit proposer.
          </p>
        </CardContent>
      </Card>

      {/* ── Hardware ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Hardware
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {HARDWARE.map((h) => (
              <div key={h.name} className="rounded-lg bg-muted/50 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-medium">{h.name}</div>
                    <div className="text-sm text-muted-foreground">{h.location}</div>
                  </div>
                  <Badge variant="outline">{h.role}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-2">{h.specs}</div>
                {h.ip && (
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono text-muted-foreground">{h.ip}</code>
                    <CopyButton value={h.ip} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Pipeline Architecture ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Pipeline Architecture
          </CardTitle>
          <CardDescription>
            7-stage finalization pipeline from ingestion to durable persist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  s.step === 6
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('font-medium text-sm', s.step === 6 && 'text-emerald-400')}>
                      {s.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.location}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Top Finality Receipts ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Top Finality Receipts
          </CardTitle>
          <CardDescription>
            69 chain-linked receipts, all verified. Top 3 by transaction count:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Round</th>
                  <th className="text-right py-2 px-4 font-medium">Finalized Txs</th>
                  <th className="text-right py-2 pl-4 font-medium">Commit Latency</th>
                </tr>
              </thead>
              <tbody>
                {TOP_RECEIPTS.map((r) => (
                  <tr key={r.round} className="border-b border-border/30">
                    <td className="py-2 pr-4 font-mono">{r.round}</td>
                    <td className="py-2 px-4 text-right font-bold">{r.txs}</td>
                    <td className="py-2 pl-4 text-right text-muted-foreground">{r.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Success Criteria ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verification Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SUCCESS_CRITERIA.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">{c.criterion}</span>
                <ProofBadge status="pass" label={c.result} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Phase Progression ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Phase Progression
          </CardTitle>
          <CardDescription>
            Throughput milestones leading to the 8.85M finalized result
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            {PHASES.map((p, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={cn(
                  'rounded-lg border px-4 py-3 text-center min-w-[90px]',
                  p.highlight
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-border/50 bg-muted/50'
                )}>
                  <div className={cn(
                    'text-xl font-bold',
                    p.highlight && 'text-emerald-400'
                  )}>
                    {p.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{p.label}</div>
                {i < PHASES.length - 1 && (
                  <span className="hidden" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Methodology ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Methodology: &ldquo;Finalized Durable TPS&rdquo;
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Finalized durable TPS</strong> measures only transactions that have:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Been Ed25519-verified on GPU (no CPU fallback)</li>
            <li>Passed through the full pipeline (routing, blocklet production, round assembly)</li>
            <li>Received DLC consensus approval from geographically remote shadow verifiers</li>
            <li>Been durably persisted to disk with fsync</li>
            <li>Been recorded in a chain-linked finality receipt</li>
          </ol>
          <p>
            This is strictly stronger than &ldquo;raw throughput&rdquo; or &ldquo;transactions processed.&rdquo;
            Every counted transaction has a cryptographic finality receipt linking it to the consensus chain.
          </p>
        </CardContent>
      </Card>

      {/* ── Verification & Replay ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            Verification &amp; Replay
          </CardTitle>
          <CardDescription>
            Independently verify this result
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Git Commit</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm font-medium">{GIT_COMMIT}</code>
                <CopyButton value={GIT_COMMIT} />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Branch</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm font-medium">{GIT_BRANCH}</code>
                <CopyButton value={GIT_BRANCH} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Bundle SHA-256</span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs break-all">{BUNDLE_SHA256}</code>
              <CopyButton value={BUNDLE_SHA256} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="text-sm font-medium">Proof Bundle Contents</span>
            <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs space-y-1">
              <div>GIT_REV.txt &mdash; commit hash</div>
              <div>CONFIG_EFFECTIVE.txt &mdash; all env vars (incl. remote shadow URLs)</div>
              <div>tps_persist.csv &mdash; per-second TPS data</div>
              <div>tps.jsonl &mdash; detailed per-second metrics</div>
              <div>finality_receipts/receipts.jsonl &mdash; 69 chain-linked DLC receipts</div>
              <div>falkenstein_shadow_evidence.log &mdash; remote shadow attestation log</div>
              <div>metrics_final.txt &mdash; full Prometheus metrics snapshot</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={GITHUB_RELEASE_URL} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download Evidence Bundle
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* ── Configuration Snapshot ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <ConfigRow label="IPPAN_CONSENSUS" value="DLC" />
            <ConfigRow label="IPPAN_DLC_ATTEST_THRESHOLD" value={METRICS.attestThreshold} />
            <ConfigRow label="IPPAN_LANES" value={METRICS.lanes.toString()} />
            <ConfigRow label="IPPAN_GROUPS" value={METRICS.groups.toString()} />
            <ConfigRow label="IPPAN_GPU_SIGVERIFY" value="1 (enabled)" />
            <ConfigRow label="IPPAN_GPU_FALLBACK_CPU" value="0 (disabled)" />
            <ConfigRow label="IPPAN_ROUND_TICK_US" value={`${(METRICS.roundTickMs * 1000).toLocaleString()} (${METRICS.roundTickMs}ms)`} />
            <ConfigRow label="IPPAN_GPU_STREAMS" value="4" />
          </div>
        </CardContent>
      </Card>

      {/* ── Footer note ──────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground text-center py-4">
        IPPAN Labs &mdash; BlockDAG v0.1.0 &mdash; {RUN_DATE} &mdash; Global DLC Benchmark
      </p>
    </div>
  );
}

/* ── Helper components ────────────────────────────────────────────── */

function MetricBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={cn('text-2xl font-bold', accent && 'text-emerald-400')}>{value}</div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <code className="text-xs text-muted-foreground">{label}</code>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
