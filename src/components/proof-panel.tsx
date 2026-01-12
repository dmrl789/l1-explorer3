'use client';

import { CheckCircle2, XCircle, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ProofStatus = 'pass' | 'fail' | 'running' | 'unavailable' | 'unknown';

interface ProofItemProps {
  label: string;
  status: ProofStatus;
  value?: string;
  loading?: boolean;
}

function ProofItem({ label, status, value, loading }: ProofItemProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
    );
  }

  const statusConfig: Record<ProofStatus, { icon: typeof CheckCircle2; color: string; text: string }> = {
    pass: { icon: CheckCircle2, color: 'text-green-600', text: value || 'PASS' },
    fail: { icon: XCircle, color: 'text-red-600', text: value || 'FAIL' },
    running: { icon: Loader2, color: 'text-yellow-600', text: value || 'RUNNING' },
    unavailable: { icon: AlertCircle, color: 'text-muted-foreground', text: value || 'UNAVAILABLE' },
    unknown: { icon: HelpCircle, color: 'text-muted-foreground', text: value || 'UNKNOWN' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={cn('flex items-center gap-1.5 font-medium text-sm', config.color)}>
        <Icon className={cn('h-4 w-4', status === 'running' && 'animate-spin')} />
        <span>{config.text}</span>
      </div>
    </div>
  );
}

interface ProofPanelProps {
  title?: string;
  items: Array<{
    label: string;
    status: ProofStatus;
    value?: string;
  }>;
  loading?: boolean;
  className?: string;
}

export function ProofPanel({
  title = 'Proof Status',
  items,
  loading = false,
  className,
}: ProofPanelProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border/50">
          {loading ? (
            <>
              <ProofItem label="" status="unknown" loading />
              <ProofItem label="" status="unknown" loading />
              <ProofItem label="" status="unknown" loading />
            </>
          ) : (
            items.map((item, index) => (
              <ProofItem
                key={index}
                label={item.label}
                status={item.status}
                value={item.value}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleProofBadgeProps {
  status: ProofStatus;
  label?: string;
  className?: string;
}

export function ProofBadge({ status, label, className }: SimpleProofBadgeProps) {
  const config: Record<ProofStatus, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    pass: { bg: 'bg-green-500/10', text: 'text-green-600', icon: CheckCircle2 },
    fail: { bg: 'bg-red-500/10', text: 'text-red-600', icon: XCircle },
    running: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: Loader2 },
    unavailable: { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: AlertCircle },
    unknown: { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: HelpCircle },
  };

  const { bg, text, icon: Icon } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        bg,
        text,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'running' && 'animate-spin')} />
      {label || status.toUpperCase()}
    </span>
  );
}
