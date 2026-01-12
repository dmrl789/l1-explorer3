'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  loading = false,
  className,
  valueClassName,
}: KpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' 
    ? 'text-green-600' 
    : trend === 'down' 
      ? 'text-red-600' 
      : 'text-muted-foreground';

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className={cn('text-2xl font-bold tracking-tight', valueClassName)}>
              {value}
            </div>
            {(subtitle || trend) && (
              <div className="flex items-center gap-2 mt-1">
                {trend && (
                  <span className={cn('flex items-center text-xs', trendColor)}>
                    <TrendIcon className="h-3 w-3 mr-0.5" />
                    {trendValue}
                  </span>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface KpiGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function KpiGrid({ children, columns = 4, className }: KpiGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
