/**
 * Environment configuration for IPPAN L1 Explorer
 */

export function getApiBases(): string[] {
  const bases: string[] = [];
  
  // In the browser, always prefer same-origin requests (avoids mixed-content + CORS).
  // This relies on Next.js rewrites for `/v1/*` (see `next.config.mjs`).
  if (typeof window !== 'undefined') {
    bases.push('');
  }

  const primary = process.env.NEXT_PUBLIC_IPPAN_API_BASE;
  if (primary) {
    const base = primary.replace(/\/$/, ''); // Remove trailing slash
    // If the site is HTTPS, never allow direct HTTP bases in the browser.
    if (!(typeof window !== 'undefined' && window.location.protocol === 'https:' && base.startsWith('http://'))) {
      bases.push(base);
    }
  }
  
  const fallback = process.env.NEXT_PUBLIC_IPPAN_API_FALLBACK;
  if (fallback) {
    const base = fallback.replace(/\/$/, '');
    if (!(typeof window !== 'undefined' && window.location.protocol === 'https:' && base.startsWith('http://'))) {
      bases.push(base);
    }
  }
  
  // Defaults (mainly for SSR/tools). Prefer a "fast" upstream, with a safe fallback.
  if (bases.length === 0) {
    bases.push('http://api2.ippan.uk');
    bases.push('http://api1.ippan.uk');
  }
  
  return bases;
}

export function getApiBase(): string {
  return getApiBases()[0];
}
