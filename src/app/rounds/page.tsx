'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useRoundsInfinite } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TableSkeleton } from '@/components/skeletons';
import { ErrorState, EmptyState } from '@/components/error-state';
import { CopyableText } from '@/components/copy-button';
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

export default function RoundsPage() {
  const { rounds, hasMore, isLoading, error, loadMore, refresh } = useRoundsInfinite(20);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <ErrorState 
          type="server" 
          message="Failed to load rounds data" 
          onRetry={refresh} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Rounds</CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && rounds.length === 0 ? (
            <TableSkeleton rows={10} columns={6} />
          ) : rounds.length === 0 ? (
            <EmptyState 
              title="No rounds found" 
              message="No rounds have been finalized yet." 
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Round ID</TableHead>
                      <TableHead>HashTimer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Finality</TableHead>
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
                            className="font-mono font-medium hover:text-primary transition-colors"
                          >
                            #{round.round_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {round.hashtimer ? (
                            <CopyableText value={round.hashtimer} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn('capitalize', statusColors[round.status])}
                          >
                            {round.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {round.finality_ms ? `${round.finality_ms}ms` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {round.block_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {round.tx_count}
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
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Rounds</h1>
      <p className="text-muted-foreground mt-1">
        Browse finalized rounds and their included blocks
      </p>
    </div>
  );
}
