'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SearchBox } from './search-box';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/primitives', label: 'Primitives' },
  { href: '/rounds', label: 'Rounds' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/tx', label: 'Transactions' },
  { href: '/audit', label: 'Audit' },
  { href: '/network', label: 'Network' },
  { href: '/evidence', label: 'Evidence' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-[#1a2332]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 text-slate-100 hover:text-slate-100">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/20 text-purple-400 font-semibold text-sm">
            AI
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-slate-100">IPPAN Explorer</div>
            <div className="text-[10px] text-slate-500">DevNet</div>
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
                  'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900/80 text-emerald-300 shadow-inner shadow-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-100'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Search + Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <SearchBox />
          </div>
          <StatusIndicator />
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBox />
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileNav pathname={pathname} />
    </header>
  );
}

function StatusIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-xs">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="hidden sm:inline text-slate-400">DevNet</span>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 bg-[#1a2332]/95 backdrop-blur safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
                isActive
                  ? 'text-emerald-300'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <span className="text-[10px] font-medium">{item.label}</span>
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
      <button className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-slate-500 hover:text-slate-300">
        <span className="text-lg">⋯</span>
        <span className="text-[10px] font-medium">More</span>
      </button>
      
      {/* Popup menu */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <div className="rounded-lg border border-slate-800 bg-slate-900 shadow-xl p-2 min-w-[140px]">
          {items.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-slate-800 text-emerald-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
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
