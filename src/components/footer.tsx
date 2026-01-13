'use client';

import { useStatus } from '@/lib/hooks';

export function Footer() {
  const { status } = useStatus();

  return (
    <footer className="border-t border-slate-700/50 bg-[#1a2332]/80">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-200">IPPAN L1 Explorer</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">DevNet</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            {status?.version && (
              <>
                <span className="text-slate-500">v{status.version}</span>
                <span className="text-slate-700">·</span>
              </>
            )}
            {status?.commit && (
              <>
                <span className="font-mono text-slate-500">
                  {status.commit.slice(0, 7)}
                </span>
                <span className="text-slate-700">·</span>
              </>
            )}
            <a 
              href="https://ippan.uk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              ippan.uk
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
