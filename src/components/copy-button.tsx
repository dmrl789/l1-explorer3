'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function CopyButton({
  value,
  label = 'Copy',
  className,
  variant = 'ghost',
  size = 'icon',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn('h-7 w-7', className)}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CopyableTextProps {
  value: string;
  display?: string;
  truncate?: boolean;
  className?: string;
  mono?: boolean;
}

export function CopyableText({
  value,
  display,
  truncate = true,
  className,
  mono = true,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  const displayValue = display ?? (truncate && value.length > 20
    ? `${value.slice(0, 10)}...${value.slice(-8)}`
    : value);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1 text-left hover:text-primary transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 rounded',
              mono && 'font-mono text-xs',
              className
            )}
          >
            <span className={truncate ? 'truncate' : ''}>{displayValue}</span>
            {copied ? (
              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
            ) : (
              <Copy className="h-3 w-3 opacity-50 flex-shrink-0" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs max-w-xs break-all">{value}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {copied ? 'Copied!' : 'Click to copy'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HashDisplayProps {
  hash: string;
  label?: string;
  className?: string;
}

export function HashDisplay({ hash, label, className }: HashDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-sm text-muted-foreground">{label}:</span>}
      <CopyableText value={hash} />
    </div>
  );
}
