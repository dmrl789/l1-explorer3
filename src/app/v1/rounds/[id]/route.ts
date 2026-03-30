import { NextRequest, NextResponse } from "next/server";
import { fetchRoundDetail } from "@/lib/roundsProxy";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { payload, upstream } = await fetchRoundDetail(id);
    const res = NextResponse.json(payload);
    res.headers.set("x-ippan-proxy-upstream", upstream);
    res.headers.set("x-ippan-proxy", "route:/v1/rounds/[id]");
    res.headers.set("cache-control", "public, s-maxage=2, stale-while-revalidate=8");
    return res;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Round not found",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 404 }
    );
  }
}
