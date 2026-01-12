'use client';

import { use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Hash,
  GitBranch,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react';
import { useBlock } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailPageSkeleton } from '@/components/skeletons';
import { ErrorState } from '@/components/error-state';
import { CopyableText, HashDisplay } from '@/components/copy-button';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BlockDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { block, isLoading, notFound, error, refresh } = useBlock(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || notFound) {
    return (
      <div className="space-y-6">
        <BackButton />
        <ErrorState 
          type={notFound ? 'not-found' : 'server'}
          title={notFound ? 'Block not found' : 'Failed to load block'}
          message={notFound 
            ? `Block ${id.slice(0, 16)}... could not be found.`
            : 'There was an error loading this block.'
          }
          onRetry={refresh}
        />
      </div>
    );
  }

  if (!block) return null;

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Block</h1>
            <Badge 
              variant={block.finalized ? 'default' : 'outline'}
              className={cn(
                block.finalized 
                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                  : ''
              )}
            >
              {block.finalized ? 'Finalized' : 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Hash className="h-4 w-4 flex-shrink-0" />
            <CopyableText value={block.block_id} truncate={false} className="break-all" />
          </div>
        </div>
        <Button variant="outline" onClick={refresh} className="flex-shrink-0">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Main Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            {block.round_id ? (
              <Link 
                href={`/rounds/${block.round_id}`}
                className="text-2xl font-bold hover:text-primary transition-colors"
              >
                #{block.round_id}
              </Link>
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{block.tx_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{block.parents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {block.size_bytes 
                ? `${(block.size_bytes / 1024).toFixed(1)} KB`
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HashTimer */}
      {block.hashtimer && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">HashTimer™</CardTitle>
            <CardDescription>Deterministic ordering timestamp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
                {block.hashtimer}
              </code>
              <CopyableText value={block.hashtimer} display="" />
            </div>
            {block.deterministic_position !== undefined && (
              <div className="mt-2 text-sm text-muted-foreground">
                Deterministic Position: #{block.deterministic_position}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parents */}
      {block.parents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Parent Blocks ({block.parents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {block.parents.map((parentId) => (
                <Link
                  key={parentId}
                  href={`/blocks/${parentId}`}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-sm truncate">{parentId}</span>
                  <Badge variant="secondary">View</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children */}
      {block.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 rotate-180" />
              Child Blocks ({block.children.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {block.children.map((childId) => (
                <Link
                  key={childId}
                  href={`/blocks/${childId}`}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-sm truncate">{childId}</span>
                  <Badge variant="secondary">View</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      {block.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transactions ({block.transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {block.transactions.slice(0, 20).map((txId) => (
                <Link
                  key={txId}
                  href={`/tx/${txId}`}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-sm truncate">{txId}</span>
                  <Badge variant="secondary">View</Badge>
                </Link>
              ))}
              {block.transactions.length > 20 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  ... and {block.transactions.length - 20} more transactions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Data */}
      {(block.state_root || block.proposer) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {block.proposer && (
              <HashDisplay hash={block.proposer} label="Proposer" />
            )}
            {block.state_root && (
              <HashDisplay hash={block.state_root} label="State Root" />
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
      <Link href="/blocks">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Blocks
      </Link>
    </Button>
  );
}
