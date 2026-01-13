'use client';

export function Footer() {
  return (
    <footer className="border-t border-slate-700/30 bg-[#151c28]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded bg-purple-500/20 text-purple-400 font-semibold text-xs">
              AI
            </div>
            <span className="font-medium text-slate-200">IPPAN Explorer</span>
          </div>
          
          <p className="text-sm text-slate-500 max-w-md">
            L1 DevNet Explorer — HashTimer™ ordering, IPPAN Time, deterministic finality.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a 
              href="https://ippan.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              ippan.net
            </a>
            <span className="text-slate-700">·</span>
            <span>DevNet</span>
          </div>
          
          <div className="pt-4 border-t border-slate-700/30 w-full">
            <p className="text-xs text-slate-600">
              © 2026 IPPAN. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
