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
  { href: '/audit', label: 'Audit / Replay' },
  { href: '/network', label: 'Network' },
  { href: '/evidence', label: 'DevNet Evidence' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-semibold">
            IP
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">IPPAN L1 Explorer</div>
            <div className="text-xs text-muted-foreground">DevNet</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Search + API indicator */}
        <div className="flex items-center gap-3">
          <SearchBox />
          <div className="hidden lg:block rounded-xl border border-border bg-white px-3 py-2 text-xs text-muted-foreground">
            API: <span className="font-mono">{process.env.NEXT_PUBLIC_IPPAN_API_BASE ?? 'not set'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
