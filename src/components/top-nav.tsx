'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  RefreshCw,
  Square,
  ArrowRightLeft,
  Shield,
  Network,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchBox } from './search-box';
import { useStatus } from '@/lib/hooks';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/primitives', label: 'Primitives', icon: Boxes },
  { href: '/rounds', label: 'Rounds', icon: RefreshCw },
  { href: '/blocks', label: 'Blocks', icon: Square },
  { href: '/tx', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/audit', label: 'Audit / Replay', icon: Shield },
  { href: '/network', label: 'Network', icon: Network },
  { href: '/evidence', label: 'DevNet Evidence', icon: FileCheck },
];

export function TopNav() {
  const pathname = usePathname();
  const { status } = useStatus();

  const health = status?.health ?? 'unknown';
  const healthColor = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-500',
  }[health];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            IP
          </div>
          <span className="hidden font-bold sm:inline-block">
            IPPAN L1 Explorer
          </span>
        </Link>

        {/* DevNet Badge */}
        <Badge variant="outline" className="mr-4 hidden md:flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', healthColor)} />
          DevNet
        </Badge>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 text-sm flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground font-medium'
                )}
              >
                <Icon className="h-4 w-4 hidden lg:block" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Docs link */}
          <a
            href="https://docs.ippan.uk"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors',
              'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
            )}
          >
            <span className="hidden sm:inline">Docs</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        {/* Search */}
        <div className="ml-auto">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
