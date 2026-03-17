'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useTransactionsInfinite } from '@/lib/hooks';
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
import { formatDistanceToNow } from 'date-fns';

export default function TransactionsPage() {
  const { transactions, hasMore, isLoading, error, loadMore, refresh } = useTransactionsInfinite(20);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <ErrorState 
          type="server" 
          message="Failed to load transactions data" 
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
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && transactions.length === 0 ? (
            <TableSkeleton rows={10} columns={6} />
          ) : transactions.length === 0 ? (
            <EmptyState 
              title="No transactions found" 
              message="No transactions have been submitted yet." 
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>From / To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>HashTimer</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.tx_id}>
                        <TableCell>
                          <Link 
                            href={`/tx/${tx.tx_id}`}
                            className="font-mono text-sm hover:text-primary transition-colors"
                          >
                            {tx.tx_id.length > 16 
                              ? `${tx.tx_id.slice(0, 8)}...${tx.tx_id.slice(-6)}`
                              : tx.tx_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {tx.from ? (
                            <div className="space-y-0.5">
                              <div className="font-mono text-xs text-muted-foreground">
                                {tx.from.slice(0, 8)}…{tx.from.slice(-4)}
                              </div>
                              {tx.to && (
                                <div className="font-mono text-xs">
                                  → {tx.to.slice(0, 8)}…{tx.to.slice(-4)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.amount ? (
                            <span className="font-mono text-sm">{tx.amount}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.hashtimer ? (
                            <CopyableText value={tx.hashtimer} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={tx.finalized ? 'default' : 'outline'}
                            className={cn(
                              tx.finalized
                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                : tx.type === 'mempool'
                                  ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                  : ''
                            )}
                          >
                            {tx.finalized ? 'Finalized' :
                             tx.type === 'mempool' ? 'Mempool' :
                             tx.type === 'included' ? 'Included' :
                             tx.type === 'unknown' ? 'Pending' :
                             tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(() => {
                            // Upstream timestamps are in microseconds (µs) — convert to ms
                            if (tx.timestamp) {
                              const ms = tx.timestamp > 1e15 ? tx.timestamp / 1000 : tx.timestamp;
                              return formatDistanceToNow(new Date(ms), { addSuffix: true });
                            }
                            if (tx.created_at) {
                              return formatDistanceToNow(new Date(tx.created_at), { addSuffix: true });
                            }
                            return '—';
                          })()}
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
      <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
      <p className="text-muted-foreground mt-1">
        Browse transactions and their finality lifecycle
      </p>
    </div>
  );
}
