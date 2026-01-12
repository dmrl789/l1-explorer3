/**
 * Environment configuration for IPPAN L1 Explorer
 */

export function getApiBases(): string[] {
  const bases: string[] = [];
  
  const primary = process.env.NEXT_PUBLIC_IPPAN_API_BASE;
  if (primary) {
    bases.push(primary.replace(/\/$/, '')); // Remove trailing slash
  }
  
  const fallback = process.env.NEXT_PUBLIC_IPPAN_API_FALLBACK;
  if (fallback) {
    bases.push(fallback.replace(/\/$/, ''));
  }
  
  // Default for local development
  if (bases.length === 0) {
    bases.push('https://api1.ippan.uk');
  }
  
  return bases;
}

export function getApiBase(): string {
  return getApiBases()[0];
}
