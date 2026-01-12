'use client';

import { use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Hash,
  CheckCircle2,
  Clock,
  Timer,
  Square,
  RefreshCw as RoundIcon,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useTransaction } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailPageSkeleton } from '@/components/skeletons';
import { ErrorState } from '@/components/error-state';
import { CopyableText, HashDisplay } from '@/components/copy-button';
import { cn } from '@/lib/utils';
import type { TxLifecycleStage } from '@/lib/schemas';

interface PageProps {
  params: Promise<{ id: string }>;
}

const lifecycleStages: Array<{
  key: TxLifecycleStage;
  label: string;
  description: string;
  icon: typeof Clock;
}> = [
  {
    key: 'ingress_checked',
    label: 'Ingress Checked',
    description: 'Transaction received and validated',
    icon: Clock,
  },
  {
    key: 'hashtimer_assigned',
    label: 'HashTimer™ Assigned',
    description: 'Deterministic ordering timestamp assigned',
    icon: Timer,
  },
  {
    key: 'included_block',
    label: 'Included in Block',
    description: 'Transaction included in a block',
    icon: Square,
  },
  {
    key: 'included_round',
    label: 'Included in Round',
    description: 'Block included in consensus round',
    icon: RoundIcon,
  },
  {
    key: 'finalized',
    label: 'Finalized',
    description: 'Transaction permanently committed',
    icon: CheckCircle2,
  },
];

export default function TransactionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { transaction, isLoading, notFound, error, refresh } = useTransaction(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || notFound) {
    return (
      <div className="space-y-6">
        <BackButton />
        <ErrorState 
          type={notFound ? 'not-found' : 'server'}
          title={notFound ? 'Transaction not found' : 'Failed to load transaction'}
          message={notFound 
            ? `Transaction ${id.slice(0, 16)}... could not be found.`
            : 'There was an error loading this transaction.'
          }
          onRetry={refresh}
        />
      </div>
    );
  }

  if (!transaction) return null;

  // Build lifecycle state map
  const lifecycleMap = new Map(
    transaction.lifecycle.map(event => [event.stage, event])
  );

  // Determine which stages are complete
  const getStageStatus = (stage: TxLifecycleStage): 'complete' | 'current' | 'pending' => {
    const stageOrder = lifecycleStages.map(s => s.key);
    const stageIndex = stageOrder.indexOf(stage);
    
    if (lifecycleMap.has(stage)) {
      return 'complete';
    }
    
    // Check if any later stage is complete (shouldn't happen, but handle it)
    for (let i = stageIndex + 1; i < stageOrder.length; i++) {
      if (lifecycleMap.has(stageOrder[i])) {
        return 'complete';
      }
    }
    
    // Check if this is the next expected stage
    let lastCompleteIndex = -1;
    for (let i = 0; i < stageOrder.length; i++) {
      if (lifecycleMap.has(stageOrder[i])) {
        lastCompleteIndex = i;
      }
    }
    
    if (stageIndex === lastCompleteIndex + 1) {
      return 'current';
    }
    
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Transaction</h1>
            <Badge variant="outline" className="capitalize">
              {transaction.type}
            </Badge>
            <Badge 
              variant={transaction.finalized ? 'default' : 'outline'}
              className={cn(
                transaction.finalized 
                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                  : ''
              )}
            >
              {transaction.finalized ? 'Finalized' : 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Hash className="h-4 w-4 flex-shrink-0" />
            <CopyableText value={transaction.tx_id} truncate={false} className="break-all" />
          </div>
        </div>
        <Button variant="outline" onClick={refresh} className="flex-shrink-0">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Lifecycle Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Lifecycle</CardTitle>
          <CardDescription>
            Track the transaction from ingress to finality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {lifecycleStages.map((stage, index) => {
              const status = getStageStatus(stage.key);
              const event = lifecycleMap.get(stage.key);
              const Icon = stage.icon;
              
              return (
                <div key={stage.key} className="relative pb-8 last:pb-0">
                  {/* Connecting line */}
                  {index < lifecycleStages.length - 1 && (
                    <div className={cn(
                      'absolute left-5 top-10 bottom-0 w-0.5',
                      status === 'complete' ? 'bg-green-500/30' : 'bg-muted'
                    )} />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      status === 'complete' 
                        ? 'bg-green-500/10 text-green-600' 
                        : status === 'current'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-muted text-muted-foreground'
                    )}>
                      {status === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : status === 'current' ? (
                        <Clock className="h-5 w-5 animate-pulse" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={cn(
                          'font-medium',
                          status === 'pending' && 'text-muted-foreground'
                        )}>
                          {stage.label}
                        </h4>
                        {event?.latency_ms && (
                          <Badge variant="outline" className="text-xs">
                            +{event.latency_ms}ms
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                      {event?.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Total Latency */}
      {transaction.total_latency_ms && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">End-to-End Latency</h3>
                <p className="text-sm text-muted-foreground">
                  Total time from ingress to finality
                </p>
              </div>
            </div>
            <div className="text-3xl font-bold">
              {transaction.total_latency_ms}ms
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.block_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Block</span>
                <Link 
                  href={`/blocks/${transaction.block_id}`}
                  className="font-mono text-sm hover:text-primary transition-colors"
                >
                  {transaction.block_id.slice(0, 8)}...{transaction.block_id.slice(-6)}
                </Link>
              </div>
            )}
            {transaction.round_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Round</span>
                <Link 
                  href={`/rounds/${transaction.round_id}`}
                  className="font-mono text-sm hover:text-primary transition-colors"
                >
                  #{transaction.round_id}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.sender && (
              <HashDisplay hash={transaction.sender} label="From" />
            )}
            {transaction.receiver && (
              <HashDisplay hash={transaction.receiver} label="To" />
            )}
            {transaction.size_bytes && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm">{transaction.size_bytes} bytes</span>
              </div>
            )}
            {transaction.nonce !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nonce</span>
                <span className="text-sm font-mono">{transaction.nonce}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HashTimer */}
      {transaction.hashtimer && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">HashTimer™</CardTitle>
            <CardDescription>Deterministic ordering timestamp</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block p-3 rounded-md bg-muted font-mono text-sm break-all">
              {transaction.hashtimer}
            </code>
          </CardContent>
        </Card>
      )}

      {/* Cryptographic Data */}
      {(transaction.payload_hash || transaction.signature) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cryptographic Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.payload_hash && (
              <HashDisplay hash={transaction.payload_hash} label="Payload Hash" />
            )}
            {transaction.signature && (
              <HashDisplay hash={transaction.signature} label="Signature" />
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
      <Link href="/tx">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Transactions
      </Link>
    </Button>
  );
}
