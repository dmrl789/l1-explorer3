'use client';

import Link from 'next/link';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  Clock,
  GitCommit,
  Database,
} from 'lucide-react';
import { useAuditReplayStatus, useCheckpointsInfinite } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PageSkeleton, TableSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/error-state';
import { CopyableText, CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ReplayStatus } from '@/lib/schemas';

const statusConfig: Record<ReplayStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  label: string;
}> = {
  pass: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    label: 'PASS',
  },
  fail: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    label: 'FAIL',
  },
  running: {
    icon: Loader2,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    label: 'RUNNING',
  },
  unavailable: {
    icon: AlertTriangle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'UNAVAILABLE',
  },
};

export default function AuditPage() {
  const { replayStatus, isLoading: statusLoading, refresh: refreshStatus } = useAuditReplayStatus();
  const { 
    checkpoints, 
    hasMore, 
    isLoading: checkpointsLoading, 
    loadMore, 
    refresh: refreshCheckpoints 
  } = useCheckpointsInfinite(10);

  if (statusLoading && !replayStatus) {
    return <PageSkeleton />;
  }

  const status = replayStatus?.status ?? 'unavailable';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit / Replay</h1>
          <p className="text-muted-foreground mt-1">
            Verify network integrity and state replayability
          </p>
        </div>
        <Button variant="outline" onClick={() => { refreshStatus(); refreshCheckpoints(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Replay Status Card */}
      <Card className={cn('relative overflow-hidden', config.bgColor)}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'rounded-full p-4',
                config.bgColor
              )}>
                <StatusIcon className={cn(
                  'h-8 w-8',
                  config.color,
                  status === 'running' && 'animate-spin'
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Replay Status</h2>
                  <Badge 
                    variant="outline" 
                    className={cn(config.color, 'border-current')}
                  >
                    {config.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {status === 'pass' && 'All state transitions verified from genesis'}
                  {status === 'fail' && 'Replay verification failed'}
                  {status === 'running' && 'Replay verification in progress'}
                  {status === 'unavailable' && 'Replay status endpoint not available'}
                </p>
              </div>
            </div>

            {replayStatus && status !== 'unavailable' && (
              <div className="flex flex-wrap gap-4 text-sm">
                {replayStatus.last_run && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Last run: {formatDistanceToNow(new Date(replayStatus.last_run), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {replayStatus.duration_ms && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{(replayStatus.duration_ms / 1000).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {replayStatus && status !== 'unavailable' && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Rounds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {replayStatus.verified_rounds?.toLocaleString() ?? '—'}
              </div>
              {replayStatus.from_round && replayStatus.to_round && (
                <p className="text-xs text-muted-foreground">
                  #{replayStatus.from_round} → #{replayStatus.to_round}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {replayStatus.verified_blocks?.toLocaleString() ?? '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {replayStatus.verified_transactions?.toLocaleString() ?? '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commit Fingerprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              {replayStatus.commit_fingerprint ? (
                <div className="flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                  <code className="font-mono text-sm">
                    {replayStatus.commit_fingerprint.slice(0, 7)}
                  </code>
                  <CopyButton value={replayStatus.commit_fingerprint} />
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {replayStatus?.error_message && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-600">Replay Error</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {replayStatus.error_message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkpoints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              State Checkpoints
            </CardTitle>
            <CardDescription>
              Cryptographic commitments at each round boundary
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {checkpointsLoading && checkpoints.length === 0 ? (
            <TableSkeleton rows={5} columns={5} />
          ) : checkpoints.length === 0 ? (
            <EmptyState 
              title="No checkpoints available"
              message="State checkpoints will appear here once the audit system is running."
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>State Root</TableHead>
                      <TableHead>Round Root</TableHead>
                      <TableHead>Tx Root</TableHead>
                      <TableHead className="text-center">Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkpoints.map((checkpoint) => (
                      <TableRow key={String(checkpoint.round_id)}>
                        <TableCell>
                          <Link 
                            href={`/rounds/${checkpoint.round_id}`}
                            className="font-mono font-medium hover:text-primary transition-colors"
                          >
                            #{checkpoint.round_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {checkpoint.state_root ? (
                            <CopyableText value={checkpoint.state_root} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {checkpoint.round_root ? (
                            <CopyableText value={checkpoint.round_root} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {checkpoint.tx_root ? (
                            <CopyableText value={checkpoint.tx_root} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {checkpoint.verified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={checkpointsLoading}
                  >
                    {checkpointsLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Why Replayability Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Complete Audit Trail</h3>
              <p className="text-sm text-muted-foreground">
                Every state transition from genesis can be independently verified. 
                Perfect for regulatory compliance.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Deterministic Execution</h3>
              <p className="text-sm text-muted-foreground">
                Same inputs always produce same outputs. No hidden state, 
                no execution ambiguity.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Trustless Verification</h3>
              <p className="text-sm text-muted-foreground">
                Anyone can run the replay and verify the network state 
                without trusting any single party.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
