import { NextResponse } from "next/server";

function upstreamBase(): string {
  return (process.env.UPSTREAM_RPC_BASE || "http://api2.ippan.uk").replace(/\/$/, "");
}

function upstreamBlocksBase(): string {
  // Blocks are currently reliably served from api1; allow override via env.
  return (process.env.UPSTREAM_BLOCKS_BASE || "http://api1.ippan.uk").replace(/\/$/, "");
}

export const dynamic = "force-dynamic";

async function fetchBlockFrom(base: string, id: string, search: string) {
  const upstream = new URL(`${base.replace(/\/$/, "")}/v1/blocks/${encodeURIComponent(id)}`);
  upstream.search = search;

  return fetch(upstream.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);

  let r = await fetchBlockFrom(upstreamBlocksBase(), id, url.search);
  if (!r.ok && (r.status === 404 || r.status === 501)) {
    r = await fetchBlockFrom(upstreamBase(), id, url.search);
  }

  const body = await r.arrayBuffer();
  const res = new NextResponse(body, { status: r.status });
  res.headers.set("x-ippan-proxy", "route:/v1/blocks/[id]");
  res.headers.set("cache-control", "no-store");

  const ct = r.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);

  const git = r.headers.get("x-ippan-git");
  if (git) res.headers.set("x-ippan-git", git);

  return res;
}

