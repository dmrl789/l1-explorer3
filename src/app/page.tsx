'use client';

import Link from 'next/link';
import { 
  Activity, 
  Clock, 
  Zap, 
  Users, 
  CheckCircle2, 
  Hash,
  ArrowRight,
} from 'lucide-react';
import { useStatus, useSeries } from '@/lib/hooks';
import { KpiCard, KpiGrid } from '@/components/kpi-card';
import { SeriesChart, MultiSeriesChart } from '@/components/series-chart';
import { ProofPanel } from '@/components/proof-panel';
import { PageSkeleton } from '@/components/skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { status, isLoading: statusLoading } = useStatus();
  const { series, isLoading: seriesLoading } = useSeries('5m');

  if (statusLoading && !status) {
    return <PageSkeleton />;
  }

  const healthColor = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-500',
  }[status?.health ?? 'unknown'];

  // Extract series data for charts
  const tpsSeries = series.filter(s => 
    s.metric.toLowerCase().includes('tps') || 
    s.metric.toLowerCase().includes('throughput')
  );
  const finalitySeries = series.find(s => 
    s.metric.toLowerCase().includes('finality') && 
    s.metric.toLowerCase().includes('p95')
  );

  // Build proof items
  type ProofStatus = 'pass' | 'fail' | 'running' | 'unavailable';
  const proofItems: Array<{ label: string; status: ProofStatus; value?: string }> = [
    {
      label: 'Deterministic Ordering',
      status: status?.deterministic_ordering ? 'pass' : 'fail',
      value: status?.deterministic_ordering ? 'ON' : 'OFF',
    },
    {
      label: 'HashTimer™ Ordering',
      status: (status?.hashtimer_ordering === 'canonical' ? 'pass' : 
              status?.hashtimer_ordering === 'partial' ? 'running' : 'fail') as ProofStatus,
      value: status?.hashtimer_ordering?.toUpperCase() ?? 'UNKNOWN',
    },
    {
      label: 'Replay from Genesis',
      status: (status?.replay_status ?? 'unavailable') as ProofStatus,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            IPPAN L1 DevNet — Real-time network overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full animate-pulse', healthColor)} />
            {status?.health ?? 'Unknown'}
          </Badge>
          <Badge variant="secondary">{status?.network_name ?? 'DevNet'}</Badge>
        </div>
      </div>

      {/* KPI Grid */}
      <KpiGrid columns={5}>
        <KpiCard
          title="Network Health"
          value={
            <span className="flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', healthColor)} />
              {status?.health ?? 'Unknown'}
            </span>
          }
          icon={<Activity className="h-4 w-4" />}
          loading={statusLoading}
        />
        
        <KpiCard
          title="IPPAN Time"
          value={status?.ippan_time?.value?.toLocaleString() ?? '—'}
          subtitle={status?.ippan_time?.monotonic ? 'Monotonic ✓' : 'Non-monotonic'}
          icon={<Clock className="h-4 w-4" />}
          loading={statusLoading}
        />
        
        <KpiCard
          title="Finality p95"
          value={status?.finality?.p95_ms ? `${status.finality.p95_ms}ms` : '—'}
          subtitle={status?.finality?.p99_ms ? `p99: ${status.finality.p99_ms}ms` : undefined}
          icon={<Zap className="h-4 w-4" />}
          loading={statusLoading}
        />
        
        <KpiCard
          title="TPS"
          value={
            <span className="flex items-baseline gap-1">
              <span>{status?.finalized_tps?.toFixed(1) ?? '0'}</span>
              <span className="text-sm text-muted-foreground">
                / {status?.accepted_tps?.toFixed(1) ?? '0'}
              </span>
            </span>
          }
          subtitle="Finalized / Accepted"
          icon={<Zap className="h-4 w-4" />}
          loading={statusLoading}
        />
        
        <KpiCard
          title="Validators"
          value={
            <span className="flex items-baseline gap-1">
              <span>{status?.active_validators ?? 0}</span>
              {(status?.shadow_verifiers ?? 0) > 0 && (
                <span className="text-sm text-muted-foreground">
                  + {status?.shadow_verifiers} shadows
                </span>
              )}
            </span>
          }
          icon={<Users className="h-4 w-4" />}
          loading={statusLoading}
        />
      </KpiGrid>

      {/* Head State */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Round</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono">
                  {status?.latest_round_id ?? '—'}
                </span>
                {status?.latest_round_id && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/rounds/${status.latest_round_id}`}>
                      View <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
              {status?.latest_hashtimer && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono truncate">{status.latest_hashtimer}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono truncate max-w-[200px]">
                  {status?.latest_block_id 
                    ? typeof status.latest_block_id === 'string' && status.latest_block_id.length > 16
                      ? `${status.latest_block_id.slice(0, 8)}...${status.latest_block_id.slice(-6)}`
                      : status.latest_block_id
                    : '—'}
                </span>
                {status?.latest_block_id && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/blocks/${status.latest_block_id}`}>
                      View <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {tpsSeries.length > 0 ? (
          <MultiSeriesChart
            title="Throughput (TPS)"
            description="Accepted vs Finalized transactions per second"
            series={tpsSeries.map((s, i) => ({
              name: s.metric,
              data: s.points,
              color: i === 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))',
            }))}
            loading={seriesLoading}
            height={250}
            unit="TPS"
          />
        ) : (
          <SeriesChart
            title="Throughput (TPS)"
            description="Transaction throughput over time"
            data={[]}
            loading={seriesLoading}
            height={250}
            color="hsl(var(--chart-1))"
          />
        )}

        <SeriesChart
          title="Finality Latency (p95)"
          description="Time to finality in milliseconds"
          data={finalitySeries?.points ?? []}
          loading={seriesLoading}
          height={250}
          color="hsl(var(--chart-2))"
          unit="ms"
        />
      </div>

      {/* Proof Panel */}
      <div className="grid gap-4 md:grid-cols-3">
        <ProofPanel
          title="Determinism Proof"
          items={proofItems}
          loading={statusLoading}
          className="md:col-span-1"
        />
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/primitives">
                  <Hash className="h-4 w-4 mr-2" />
                  Explore Primitives
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/rounds">
                  View All Rounds
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/audit">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Audit / Replay
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/evidence">
                  DevNet Evidence
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
