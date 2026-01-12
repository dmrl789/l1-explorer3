'use client';

import { use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Users, 
  Square,
  Hash,
  Shield,
} from 'lucide-react';
import { useRound } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailPageSkeleton } from '@/components/skeletons';
import { ErrorState } from '@/components/error-state';
import { CopyableText, HashDisplay } from '@/components/copy-button';
import { cn } from '@/lib/utils';
import type { RoundStatus } from '@/lib/schemas';

const statusColors: Record<RoundStatus, string> = {
  proposed: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  verified: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  finalized: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  unknown: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RoundDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { round, isLoading, notFound, error, refresh } = useRound(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || notFound) {
    return (
      <div className="space-y-6">
        <BackButton />
        <ErrorState 
          type={notFound ? 'not-found' : 'server'}
          title={notFound ? 'Round not found' : 'Failed to load round'}
          message={notFound 
            ? `Round #${id} could not be found.`
            : 'There was an error loading this round.'
          }
          onRetry={refresh}
        />
      </div>
    );
  }

  if (!round) return null;

  // Build timeline steps
  const timelineSteps = [
    { 
      label: 'Proposed', 
      timestamp: round.proposed_at,
      complete: !!round.proposed_at || round.status !== 'pending',
    },
    { 
      label: 'Verified', 
      timestamp: round.verified_at,
      complete: !!round.verified_at || round.status === 'finalized',
    },
    { 
      label: 'Finalized', 
      timestamp: round.finalized_at,
      complete: round.status === 'finalized',
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight font-mono">
              Round #{round.round_id}
            </h1>
            <Badge 
              variant="outline" 
              className={cn('capitalize', statusColors[round.status])}
            >
              {round.status}
            </Badge>
          </div>
          {round.hashtimer && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <CopyableText value={round.hashtimer} truncate={false} />
            </div>
          )}
        </div>
        <Button variant="outline" onClick={refresh}>Refresh</Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Round Lifecycle</CardTitle>
          <CardDescription>Status progression of this round</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, index) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    step.complete 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {step.complete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-sm font-medium mt-2">{step.label}</span>
                  {step.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {index < timelineSteps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4',
                    step.complete ? 'bg-green-500/30' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Finality Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {round.finality_ms ? `${round.finality_ms}ms` : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blocks Included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{round.block_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{round.tx_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      {round.participants && round.participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({round.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {round.participants.map((participant, index) => (
                <div 
                  key={participant.node_id || index}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      participant.signed ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    <span className="font-mono text-xs truncate max-w-[150px]">
                      {participant.node_id}
                    </span>
                  </div>
                  {participant.role && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {participant.role.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocks */}
      {round.blocks && round.blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Square className="h-4 w-4" />
              Included Blocks ({round.blocks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {round.blocks.map((blockId) => (
                <Link
                  key={blockId}
                  href={`/blocks/${blockId}`}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-sm">{blockId}</span>
                  <Badge variant="secondary">View</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proof */}
      {round.proof && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Round Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {round.proof.threshold && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Threshold</span>
                <span className="font-medium">
                  {round.proof.signers?.length ?? 0} / {round.proof.threshold}
                </span>
              </div>
            )}
            {round.proof.proof_hash && (
              <HashDisplay hash={round.proof.proof_hash} label="Proof Hash" />
            )}
            {round.state_root && (
              <HashDisplay hash={round.state_root} label="State Root" />
            )}
            {round.round_root && (
              <HashDisplay hash={round.round_root} label="Round Root" />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BackButton() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/rounds">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Rounds
      </Link>
    </Button>
  );
}
