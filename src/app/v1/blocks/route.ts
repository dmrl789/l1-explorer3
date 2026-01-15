import { NextResponse } from "next/server";

function upstreamBase(): string {
  return (process.env.UPSTREAM_RPC_BASE || "http://api2.ippan.uk").replace(/\/$/, "");
}

function upstreamBlocksBase(): string {
  // Blocks are currently reliably served from api1; allow override via env.
  return (process.env.UPSTREAM_BLOCKS_BASE || "http://api1.ippan.uk").replace(/\/$/, "");
}

export const dynamic = "force-dynamic";

async function fetchBlocksFrom(base: string, search: string) {
  const upstream = new URL(`${base.replace(/\/$/, "")}/v1/blocks`);
  upstream.search = search;

  return fetch(upstream.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Prefer the dedicated blocks upstream (api1 by default). If overridden, still keep
  // a safety fallback to the general upstream when appropriate.
  let r = await fetchBlocksFrom(upstreamBlocksBase(), url.search);
  if (!r.ok && (r.status === 404 || r.status === 501)) {
    r = await fetchBlocksFrom(upstreamBase(), url.search);
  }

  const body = await r.arrayBuffer();
  const res = new NextResponse(body, { status: r.status });
  res.headers.set("x-ippan-proxy", "route:/v1/blocks");
  res.headers.set("cache-control", "no-store");

  const ct = r.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);

  const git = r.headers.get("x-ippan-git");
  if (git) res.headers.set("x-ippan-git", git);

  return res;
}

