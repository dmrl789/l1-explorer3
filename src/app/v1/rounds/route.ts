import { NextRequest, NextResponse } from "next/server";
import { fetchRecentRounds } from "@/lib/roundsProxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");

  try {
    const { payload, upstream } = await fetchRecentRounds({ limit });
    const res = NextResponse.json(payload);
    res.headers.set("x-ippan-proxy-upstream", upstream);
    res.headers.set("x-ippan-proxy", "route:/v1/rounds");
    res.headers.set("cache-control", "public, s-maxage=2, stale-while-revalidate=8");
    return res;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load recent rounds",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
