'use client';

import { type ReactNode } from 'react';
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
    ? 'text-emerald-400' 
    : trend === 'down' 
      ? 'text-red-400' 
      : 'text-slate-500';

  return (
    <div className={cn(
      'rounded-xl border border-slate-700/50 bg-[#1e2736] p-5 relative overflow-hidden transition-all hover:border-slate-600/50',
      className
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 to-transparent pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
            {title}
          </p>
          {icon && (
            <div className="text-slate-500">
              {icon}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4 bg-slate-700/50" />
            <Skeleton className="h-4 w-1/2 bg-slate-700/50" />
          </div>
        ) : (
          <>
            <div className={cn('text-2xl font-bold text-slate-100', valueClassName)}>
              {value}
            </div>
            {(subtitle || trend) && (
              <div className="flex items-center gap-2 mt-2">
                {trend && (
                  <span className={cn('flex items-center text-xs font-medium', trendColor)}>
                    <TrendIcon className="h-3 w-3 mr-0.5" />
                    {trendValue}
                  </span>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
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
