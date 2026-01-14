'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SearchBox } from './search-box';

const navItems = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home' },
  { href: '/primitives', label: 'Primitives', shortLabel: 'Primitives' },
  { href: '/rounds', label: 'Rounds', shortLabel: 'Rounds' },
  { href: '/blocks', label: 'Blocks', shortLabel: 'Blocks' },
  { href: '/tx', label: 'Transactions', shortLabel: 'Txs' },
  { href: '/audit', label: 'Audit', shortLabel: 'Audit' },
  { href: '/network', label: 'Network', shortLabel: 'Network' },
  { href: '/evidence', label: 'Evidence', shortLabel: 'Evidence' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/30 bg-[#151c28]/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 sm:gap-6 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 text-slate-100 hover:text-slate-100">
          <div className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs sm:text-sm border border-purple-500/20">
            AI
          </div>
          <div className="leading-tight hidden xs:block sm:block">
            <div className="text-sm sm:text-base font-semibold tracking-tight text-slate-100">IPPAN Explorer</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">DevNet</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 lg:flex flex-1 justify-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/30'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Search + Status */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <div className="hidden sm:block">
            <SearchBox />
          </div>
          <StatusIndicator />
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="sm:hidden px-3 pb-3">
        <SearchBox />
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileNav pathname={pathname} />
    </header>
  );
}

function StatusIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-slate-300 font-medium">Live</span>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/30 bg-[#151c28]/98 backdrop-blur-md safe-area-pb">
      <div className="flex items-center justify-around px-1 py-2 sm:px-2 sm:py-3">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 sm:px-3 rounded-lg transition-colors min-w-[48px]',
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300 active:bg-slate-700/30'
              )}
            >
              <span className="text-[10px] sm:text-[11px] font-medium">{item.shortLabel}</span>
            </Link>
          );
        })}
        <MobileMoreMenu items={navItems.slice(5)} pathname={pathname} />
      </div>
    </nav>
  );
}

function MobileMoreMenu({ items, pathname }: { items: typeof navItems; pathname: string }) {
  return (
    <div className="relative group">
      <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 sm:px-3 rounded-lg text-slate-500 hover:text-slate-300 active:bg-slate-700/30 min-w-[48px]">
        <span className="text-base sm:text-lg">⋯</span>
        <span className="text-[10px] sm:text-[11px] font-medium">More</span>
      </button>
      
      {/* Popup menu */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
        <div className="rounded-xl border border-slate-700/50 bg-[#1e2736] shadow-2xl p-2 min-w-[140px] sm:min-w-[160px]">
          {items.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-100 active:bg-slate-700/50'
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
