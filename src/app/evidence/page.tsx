'use client';

import { 
  GitCommit, 
  Settings, 
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  Github,
  FileText,
} from 'lucide-react';
import { useStatus, useAuditReplayStatus } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageSkeleton } from '@/components/skeletons';
import { CopyButton } from '@/components/copy-button';
import { ProofBadge } from '@/components/proof-panel';
import { cn } from '@/lib/utils';

export default function EvidencePage() {
  const { status, isLoading: statusLoading } = useStatus();
  const { replayStatus } = useAuditReplayStatus();

  if (statusLoading && !status) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DevNet Evidence</h1>
        <p className="text-muted-foreground mt-1">
          Curated data room for investor due diligence
        </p>
      </div>

      {/* Version & Commit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            Current Build
          </CardTitle>
          <CardDescription>
            Software version deployed to this DevNet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Version</span>
              <div className="font-mono text-lg font-medium">
                {status?.version ?? 'Unknown'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Commit</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg font-medium">
                  {status?.commit ? status.commit.slice(0, 7) : 'Unknown'}
                </code>
                {status?.commit && (
                  <CopyButton value={status.commit} />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Network</span>
              <div className="text-lg font-medium">
                {status?.network_name ?? 'IPPAN DevNet'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Measured Results Snapshot
          </CardTitle>
          <CardDescription>
            Live performance metrics from the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricItem 
              label="Finality p50"
              value={status?.finality?.p50_ms ? `${status.finality.p50_ms}ms` : '—'}
            />
            <MetricItem 
              label="Finality p95"
              value={status?.finality?.p95_ms ? `${status.finality.p95_ms}ms` : '—'}
            />
            <MetricItem 
              label="Finality p99"
              value={status?.finality?.p99_ms ? `${status.finality.p99_ms}ms` : '—'}
            />
            <MetricItem 
              label="Finalized TPS"
              value={status?.finalized_tps?.toFixed(1) ?? '—'}
            />
          </div>
          <Separator className="my-4" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricItem 
              label="Active Validators"
              value={status?.active_validators?.toString() ?? '—'}
            />
            <MetricItem 
              label="Shadow Verifiers"
              value={status?.shadow_verifiers?.toString() ?? '—'}
            />
            <MetricItem 
              label="IPPAN Time"
              value={status?.ippan_time?.value?.toLocaleString() ?? '—'}
              sublabel={status?.ippan_time?.monotonic ? 'Monotonic ✓' : undefined}
            />
            <MetricItem 
              label="HashTimer™ Mode"
              value={status?.hashtimer_ordering?.toUpperCase() ?? '—'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Proof Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Deterministic Ordering</span>
              <ProofBadge 
                status={status?.deterministic_ordering ? 'pass' : 'fail'}
                label={status?.deterministic_ordering ? 'ON' : 'OFF'}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">HashTimer™</span>
              <ProofBadge 
                status={status?.hashtimer_ordering === 'canonical' ? 'pass' : 
                        status?.hashtimer_ordering === 'partial' ? 'running' : 'fail'}
                label={status?.hashtimer_ordering?.toUpperCase() ?? 'UNKNOWN'}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Replay from Genesis</span>
              <ProofBadge 
                status={replayStatus?.status ?? 'unavailable'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration Highlights
          </CardTitle>
          <CardDescription>
            Key parameters for this DevNet deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ConfigItem label="Chain Type" value={status?.chain_type ?? 'L1'} />
            <ConfigItem label="Network ID" value={status?.network_id ?? 'devnet'} />
            <ConfigItem 
              label="Consensus" 
              value="Threshold Signature + HashTimer™" 
            />
            <ConfigItem 
              label="State Model" 
              value="Deterministic Replay" 
            />
          </div>
          
          {status?.config && Object.keys(status.config).length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <span className="text-sm font-medium">Additional Config</span>
                <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
                  {JSON.stringify(status.config, null, 2)}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Known Limitations */}
      <Card className="border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Known Limitations
          </CardTitle>
          <CardDescription>
            Honest disclosure of current DevNet constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>Development Network:</strong> This is a DevNet for testing and demonstration. 
                Not intended for production use.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>API Stability:</strong> Endpoints may change without notice. 
                The explorer gracefully handles missing endpoints.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>Data Persistence:</strong> DevNet may be reset periodically. 
                Historical data is not guaranteed to persist.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>
                <strong>Performance Numbers:</strong> Metrics shown are from a development 
                environment and may not reflect production capabilities.
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
          <div className="grid gap-4 md:grid-cols-3">
            <ResourceLink
              icon={<FileText className="h-5 w-5" />}
              title="Finality & Status KPIs"
              description="What the dashboard fields prove (investor-facing)"
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

function MetricItem({ 
  label, 
  value, 
  sublabel 
}: { 
  label: string; 
  value: string; 
  sublabel?: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-2xl font-bold">{value}</div>
      {sublabel && (
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      )}
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

function ResourceLink({ 
  icon, 
  title, 
  description, 
  href 
}: { 
  icon: React.ReactNode;
  title: string; 
  description: string; 
  href: string;
}) {
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
