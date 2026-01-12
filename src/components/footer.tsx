'use client';

import { useStatus } from '@/lib/hooks';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const { status } = useStatus();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-medium text-foreground">IPPAN L1 Explorer</span>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <span>DevNet</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            {status?.version && (
              <>
                <span>Version: {status.version}</span>
                <Separator orientation="vertical" className="h-3" />
              </>
            )}
            {status?.commit && (
              <>
                <span className="font-mono">
                  Commit: {status.commit.slice(0, 7)}
                </span>
                <Separator orientation="vertical" className="h-3" />
              </>
            )}
            <a 
              href="https://ippan.uk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              ippan.uk
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
