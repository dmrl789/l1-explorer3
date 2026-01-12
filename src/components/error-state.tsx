'use client';

import { AlertTriangle, RefreshCw, WifiOff, ServerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: 'error' | 'network' | 'server' | 'not-found' | 'unavailable';
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title,
  message,
  type = 'error',
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  const configs: Record<string, { icon: typeof AlertTriangle; defaultTitle: string; defaultMessage: string }> = {
    error: {
      icon: AlertTriangle,
      defaultTitle: 'Something went wrong',
      defaultMessage: 'An error occurred while loading data.',
    },
    network: {
      icon: WifiOff,
      defaultTitle: 'Network error',
      defaultMessage: 'Unable to connect. Check your connection.',
    },
    server: {
      icon: ServerOff,
      defaultTitle: 'Server unavailable',
      defaultMessage: 'The API server is not responding.',
    },
    'not-found': {
      icon: AlertTriangle,
      defaultTitle: 'Not found',
      defaultMessage: 'The requested resource could not be found.',
    },
    unavailable: {
      icon: AlertTriangle,
      defaultTitle: 'Data unavailable',
      defaultMessage: 'This data is not available from the current API.',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Icon className="h-4 w-4" />
        <span>{message || config.defaultMessage}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <Icon className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-semibold text-lg mb-1">
          {title || config.defaultTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {message || config.defaultMessage}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No data',
  message = 'There is no data to display.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && (
          <div className="rounded-full bg-muted p-3 mb-4">
            {icon}
          </div>
        )}
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
        {action}
      </CardContent>
    </Card>
  );
}

interface WarningBannerProps {
  title?: string;
  message: string;
  className?: string;
}

export function WarningBanner({ title, message, className }: WarningBannerProps) {
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4',
      className
    )}>
      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-medium text-yellow-700">{title}</p>}
        <p className="text-sm text-yellow-600">{message}</p>
      </div>
    </div>
  );
}
