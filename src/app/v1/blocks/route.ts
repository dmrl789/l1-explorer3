import { NextResponse } from "next/server";

function upstreamBase(): string {
  return (process.env.UPSTREAM_RPC_BASE || "http://api2.ippan.uk").replace(/\/$/, "");
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

  // Try primary upstream first, then fallback to api1 if blocks are not available.
  let r = await fetchBlocksFrom(upstreamBase(), url.search);
  if (!r.ok && (r.status === 404 || r.status === 501)) {
    r = await fetchBlocksFrom("http://api1.ippan.uk", url.search);
  }

  const body = await r.arrayBuffer();
  const res = new NextResponse(body, { status: r.status });
  res.headers.set("x-ippan-proxy", "route:/v1/blocks");

  const ct = r.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);

  const git = r.headers.get("x-ippan-git");
  if (git) res.headers.set("x-ippan-git", git);

  return res;
}

