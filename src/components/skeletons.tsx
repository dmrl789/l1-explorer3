'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function KpiGridSkeleton({ count = 4, columns = 4 }: { count?: number; columns?: 2 | 3 | 4 | 5 }) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
      
      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={4} />
        </CardContent>
      </Card>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <KpiGridSkeleton count={4} />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
