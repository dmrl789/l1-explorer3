'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useBlocksInfinite } from '@/lib/hooks';
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
import { ErrorState, EmptyState, WarningBanner } from '@/components/error-state';
import { CopyableText } from '@/components/copy-button';
import { cn } from '@/lib/utils';

export default function BlocksPage() {
  const { blocks, hasMore, isLoading, error, loadMore, refresh } = useBlocksInfinite(20);

  // Check if we might have the empty blocks issue
  const showEmptyWarning = !isLoading && blocks.length === 0 && !error;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <ErrorState 
          type="server" 
          message="Failed to load blocks data" 
          onRetry={refresh} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {showEmptyWarning && (
        <WarningBanner 
          title="Blocks endpoint may be empty"
          message="The blocks API endpoint returned no data. This may be a temporary issue or the endpoint may not be fully implemented yet."
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Blocks</CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && blocks.length === 0 ? (
            <TableSkeleton rows={10} columns={6} />
          ) : blocks.length === 0 ? (
            <EmptyState 
              title="No blocks found" 
              message="No blocks have been produced yet, or the blocks endpoint is unavailable." 
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block ID</TableHead>
                      <TableHead>HashTimer</TableHead>
                      <TableHead>Parents</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead className="text-right">Txs</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocks.map((block) => (
                      <TableRow key={block.block_id}>
                        <TableCell>
                          <Link 
                            href={`/blocks/${block.block_id}`}
                            className="font-mono text-sm hover:text-primary transition-colors"
                          >
                            {block.block_id.length > 16 
                              ? `${block.block_id.slice(0, 8)}...${block.block_id.slice(-6)}`
                              : block.block_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {block.hashtimer ? (
                            <CopyableText value={block.hashtimer} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {block.parent_count}
                        </TableCell>
                        <TableCell>
                          {block.round_id ? (
                            <Link 
                              href={`/rounds/${block.round_id}`}
                              className="hover:text-primary transition-colors"
                            >
                              #{block.round_id}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {block.tx_count}
                        </TableCell>
                        <TableCell className="text-center">
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
      <h1 className="text-3xl font-bold tracking-tight">Blocks</h1>
      <p className="text-muted-foreground mt-1">
        Browse blocks and their transaction contents
      </p>
    </div>
  );
}
