'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/hooks';
import { detectSearchType, type SearchHitType } from '@/lib/schemas';

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { hits, isLoading } = useSearch(debouncedQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToResult = useCallback((type: SearchHitType, id: string) => {
    setIsOpen(false);
    setQuery('');
    
    // If type is unknown, try to detect from pattern
    const effectiveType = type === 'unknown' ? detectSearchType(id) ?? type : type;
    
    switch (effectiveType) {
      case 'transaction':
        router.push(`/tx/${id}`);
        break;
      case 'block':
        router.push(`/blocks/${id}`);
        break;
      case 'round':
        router.push(`/rounds/${id}`);
        break;
      case 'node':
        router.push(`/network?node=${id}`);
        break;
      default:
        // Default: try as transaction
        router.push(`/tx/${id}`);
    }
  }, [router]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = query.trim();
    if (!trimmed) return;

    // If we have results, navigate to first one
    if (hits.length > 0) {
      navigateToResult(hits[0].type, hits[0].id);
      return;
    }

    // Try to detect type and navigate directly
    const type = detectSearchType(trimmed);
    if (type) {
      navigateToResult(type, trimmed);
      return;
    }

    // Default: try as transaction
    router.push(`/tx/${trimmed}`);
    setIsOpen(false);
    setQuery('');
  }, [query, hits, navigateToResult, router]);

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search tx, block, round..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9 pr-8 w-[200px] lg:w-[300px]"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-lg z-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : hits.length > 0 ? (
            <ul className="py-1">
              {hits.slice(0, 5).map((hit) => (
                <li key={`${hit.type}-${hit.id}`}>
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      'flex items-center gap-2'
                    )}
                    onClick={() => navigateToResult(hit.type, hit.id)}
                  >
                    <TypeBadge type={hit.type} />
                    <span className="truncate font-mono text-xs">
                      {hit.id.length > 20 
                        ? `${hit.id.slice(0, 10)}...${hit.id.slice(-8)}` 
                        : hit.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : debouncedQuery && !isLoading ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No results found. Press Enter to search directly.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: SearchHitType }) {
  const colors: Record<SearchHitType, string> = {
    transaction: 'bg-blue-500/10 text-blue-600',
    block: 'bg-purple-500/10 text-purple-600',
    round: 'bg-green-500/10 text-green-600',
    node: 'bg-orange-500/10 text-orange-600',
    unknown: 'bg-gray-500/10 text-gray-600',
  };

  const labels: Record<SearchHitType, string> = {
    transaction: 'TX',
    block: 'Block',
    round: 'Round',
    node: 'Node',
    unknown: '?',
  };

  return (
    <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', colors[type])}>
      {labels[type]}
    </span>
  );
}
