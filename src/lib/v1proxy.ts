/* src/lib/v1proxy.ts */
/* Hardened /v1 proxy: timeout, retries, upstream fallback, tiny GET cache, debug headers */

import { NextRequest, NextResponse } from "next/server";

type CacheEntry = { expiresAt: number; status: number; headers: [string, string][]; body: string };

type ProxyOpts = {
  forcePath?: string; // e.g. "/v1/tx?limit=25" — overrides req.nextUrl.pathname + search
};

// Very small in-memory cache per serverless instance (helps a lot with polling endpoints)
const GET_CACHE: Map<string, CacheEntry> = new Map();

function nowMs(): number {
  return Date.now();
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function getUpstreams(): string[] {
  const raw = (process.env.UPSTREAM_V1_BASES ?? "").trim();
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, "")); // trim trailing slashes
  return list.length ? list : [];
}

function pickUpstream(upstreams: string[], attempt: number): string {
  // deterministic-ish rotation per attempt (avoid sticky failure)
  const idx = attempt % upstreams.length;
  return upstreams[idx];
}

function isCacheable(req: NextRequest): boolean {
  if (req.method !== "GET") return false;
  if (req.nextUrl.searchParams.get("nocache") === "1") return false;
  // Don’t cache if client sends auth/cookie headers (paranoia / correctness)
  if (req.headers.get("authorization")) return false;
  if (req.headers.get("cookie")) return false;
  return true;
}

function makeCacheKey(upstreamBase: string, pathWithQuery: string): string {
  // Cache by full upstream URL (includes query string)
  return `${upstreamBase}${pathWithQuery}`;
}

function setCommonResponseHeaders(res: NextResponse, upstream: string, ms: number): void {
  res.headers.set("x-ippan-proxy-upstream", upstream);
  res.headers.set("x-ippan-proxy-ms", String(ms));
  res.headers.set("x-ippan-proxy", "route:/v1/[...path]");
  // Micro edge caching: helps reduce thundering herd; keep TTL tiny
  // Vercel honors s-maxage/stale-while-revalidate for CDN caching.
  const ttlMs = parseIntEnv("PROXY_CACHE_TTL_MS", 1000);
  const ttl = Math.max(0, Math.floor(ttlMs / 1000));
  if (ttl > 0) {
    res.headers.set("cache-control", `public, s-maxage=${ttl}, stale-while-revalidate=${Math.max(1, ttl * 4)}`);
  } else {
    res.headers.set("cache-control", "no-store");
  }
}

function cloneSafeHeadersFromUpstream(upstreamRes: Response): [string, string][] {
  const out: [string, string][] = [];
  // Only forward safe headers; never forward hop-by-hop headers.
  const allow = new Set([
    "content-type",
    "cache-control",
    "etag",
    "last-modified",
    "x-request-id",
    "x-ippan-node",
  ]);
  upstreamRes.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (allow.has(key)) out.push([key, v]);
  });
  return out;
}

async function readBodyAsText(res: Response): Promise<string> {
  // Upstream may not be JSON on errors; keep as text so we can surface it
  return await res.text();
}

export async function proxyV1(req: NextRequest, opts: ProxyOpts = {}): Promise<NextResponse> {
  const upstreams = getUpstreams();
  if (!upstreams.length) {
    return NextResponse.json(
      { ok: false, error: "UPSTREAM_V1_BASES not set", hint: "Set UPSTREAM_V1_BASES to your HTTPS gateway base" },
      { status: 500 }
    );
  }

  const timeoutMs = parseIntEnv("PROXY_TIMEOUT_MS", 3500);
  const retries = parseIntEnv("PROXY_RETRIES", 2);
  const cacheTtlMs = parseIntEnv("PROXY_CACHE_TTL_MS", 1000);

  // Support forced path override for compatibility routes (e.g. /v1/tx/recent → /v1/tx?limit=25)
  const pathWithQuery = opts.forcePath ?? (req.nextUrl.pathname + req.nextUrl.search);
  // Split back out for URL building (if forcePath includes query string)
  const qIdx = pathWithQuery.indexOf("?");
  const pathname = qIdx >= 0 ? pathWithQuery.slice(0, qIdx) : pathWithQuery;
  const search = qIdx >= 0 ? pathWithQuery.slice(qIdx) : "";
  const method = req.method.toUpperCase();

  const attempted: Array<{ upstream: string; url: string; err?: string; ms?: number }> = [];

  // For GET, tiny in-memory cache per instance (in addition to CDN caching)
  if (isCacheable(req) && cacheTtlMs > 0) {
    const key = makeCacheKey(upstreams[0], pathWithQuery); // key by primary upstream for cache hit stability
    const hit = GET_CACHE.get(key);
    if (hit && hit.expiresAt > nowMs()) {
      const res = new NextResponse(hit.body, { status: hit.status });
      for (const [k, v] of hit.headers) res.headers.set(k, v);
      res.headers.set("x-ippan-proxy-cache", "HIT");
      setCommonResponseHeaders(res, upstreams[0], 0);
      return res;
    }
  }

  const hasBody = !(method === "GET" || method === "HEAD");
  const bodyText = hasBody ? await req.text() : undefined;

  let lastErr: unknown = undefined;

  const attempts = Math.max(1, retries + 1);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const upstream = pickUpstream(upstreams, attempt);
    const url = `${upstream}${pathname}${search}`;

    attempted.push({ upstream, url });

    const controller = new AbortController();
    const t0 = nowMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        accept: req.headers.get("accept") ?? "application/json",
      };

      const proxyKey = (process.env.EXPLORER_PROXY_KEY ?? "").trim();
      if (proxyKey) headers["x-ippan-explorer-key"] = proxyKey;

      const ct = req.headers.get("content-type");
      if (ct && hasBody) headers["content-type"] = ct;

      const upstreamRes = await fetch(url, {
        method,
        headers,
        body: hasBody ? bodyText : undefined,
        signal: controller.signal,
        cache: "no-store",
      });

      const ms = nowMs() - t0;
      clearTimeout(timer);

      const body = await readBodyAsText(upstreamRes);
      const safeHeaders = cloneSafeHeadersFromUpstream(upstreamRes);

      const res = new NextResponse(body, { status: upstreamRes.status });
      for (const [k, v] of safeHeaders) res.headers.set(k, v);

      setCommonResponseHeaders(res, upstream, ms);
      res.headers.set("x-ippan-proxy-cache", "MISS");

      if (method === "GET" && upstreamRes.ok && isCacheable(req) && cacheTtlMs > 0) {
        const expiresAt = nowMs() + cacheTtlMs;
        const key = makeCacheKey(upstreams[0], pathWithQuery);
        GET_CACHE.set(key, { expiresAt, status: upstreamRes.status, headers: safeHeaders, body });
      }

      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      const current = attempted[attempted.length - 1];
      if (current) {
        current.err = String(e);
        current.ms = nowMs() - t0;
      }
    }
  }

  const res = NextResponse.json(
    {
      ok: false,
      error: "Proxy upstream failed",
      detail: String(lastErr ?? "unknown error"),
      hint: "Check gateway health, timeouts, and UPSTREAM_V1_BASES",
      attempted,
    },
    { status: 502 }
  );

  // Always expose debug headers on failure:
  res.headers.set("x-ippan-proxy", "v1");
  res.headers.set("x-ippan-proxy-attempts", String(attempted.length));
  res.headers.set("x-ippan-proxy-upstreams", upstreams.join(","));
  return res;
}
