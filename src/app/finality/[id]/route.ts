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

async function resolveCanonicalFinalityPath(
  upstream: string,
  id: string,
  headers: Record<string, string>,
  timeoutMs: number
) {
  const directPath = id.startsWith('/finality/') ? id : `/finality/${encodeURIComponent(id)}`;
  const directResponse = await fetchWithTimeout(`${upstream}${directPath}`, headers, timeoutMs);
  if (directResponse.ok) {
    return { response: directResponse, path: directPath };
  }

  const blockResponse = await fetchWithTimeout(
    `${upstream}/v1/blocks/${encodeURIComponent(id)}`,
    headers,
    timeoutMs
  );

  if (!blockResponse.ok) {
    return null;
  }

  const blockData = (await blockResponse.json()) as Record<string, unknown>;
  const endpoint = blockData.finality_cert_endpoint;
  if (typeof endpoint !== 'string' || !endpoint.startsWith('/finality/')) {
    return null;
  }

  const certificateResponse = await fetchWithTimeout(`${upstream}${endpoint}`, headers, timeoutMs);
  if (!certificateResponse.ok) {
    return null;
  }

  return { response: certificateResponse, path: endpoint };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const timeoutMs = parseIntEnv('PROXY_TIMEOUT_MS', 5000);
  const headers: Record<string, string> = { accept: 'application/json' };
  const key = (process.env.EXPLORER_PROXY_KEY ?? '').trim();

  if (key) {
    headers['x-ippan-explorer-key'] = key;
  }

  for (const upstream of getUpstreams()) {
    try {
      const resolved = await resolveCanonicalFinalityPath(upstream, id, headers, timeoutMs);
      if (!resolved) {
        continue;
      }

      const body = await resolved.response.text();

      const proxied = new NextResponse(body, { status: resolved.response.status });
      proxied.headers.set('content-type', resolved.response.headers.get('content-type') ?? 'application/json');
      proxied.headers.set('cache-control', 'no-store');
      proxied.headers.set('x-ippan-finality-upstream', upstream);
      proxied.headers.set('x-ippan-finality-path', resolved.path);
      return proxied;
    } catch {
      // try next upstream
    }
  }

  return NextResponse.json(
    { code: 'not_found', message: 'finality certificate unavailable' },
    { status: 404, headers: { 'cache-control': 'no-store' } }
  );
}
