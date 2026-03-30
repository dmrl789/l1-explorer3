import { NextResponse } from 'next/server';
import { getUpstreams } from '@/lib/upstreams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind, id } = await context.params;
  if (kind !== 'block' && kind !== 'tx') {
    return NextResponse.json(
      { code: 'invalid_kind', message: 'kind must be block or tx' },
      { status: 400, headers: { 'cache-control': 'no-store' } }
    );
  }

  const timeoutMs = parseIntEnv('PROXY_TIMEOUT_MS', 8000);
  const headers: Record<string, string> = { accept: 'application/json' };
  const key = (process.env.EXPLORER_PROXY_KEY ?? '').trim();
  if (key) headers['x-ippan-explorer-key'] = key;

  for (const upstream of getUpstreams()) {
    try {
      const response = await fetchWithTimeout(
        `${upstream}/v1/proof-bundles/${kind}/${encodeURIComponent(id)}`,
        headers,
        timeoutMs
      );
      if (!response.ok) continue;

      const body = await response.text();
      const proxied = new NextResponse(body, { status: response.status });
      proxied.headers.set('content-type', response.headers.get('content-type') ?? 'application/json');
      proxied.headers.set('cache-control', 'no-store');
      proxied.headers.set('x-ippan-proof-bundle-upstream', upstream);
      return proxied;
    } catch {
      // try next upstream
    }
  }

  return NextResponse.json(
    { code: 'not_found', message: 'proof bundle unavailable' },
    { status: 404, headers: { 'cache-control': 'no-store' } }
  );
}
