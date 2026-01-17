/* src/app/v1/tx/recent/route.ts */
/**
 * Compatibility endpoint for /v1/tx/recent.
 *
 * The UI expects /v1/tx/recent, but the upstream API may expose transactions
 * at a different path (e.g. /v1/tx?limit=... or /v1/transactions?limit=...).
 *
 * Set TX_RECENT_UPSTREAM_PATH env var to the real upstream path pattern.
 * Use {limit} as placeholder for the limit query param.
 *
 * Examples:
 *   TX_RECENT_UPSTREAM_PATH=/v1/transactions?limit={limit}
 *   TX_RECENT_UPSTREAM_PATH=/v1/tx?limit={limit}
 *
 * If not set, defaults to /v1/transactions?limit={limit}
 */

import { NextRequest } from "next/server";
import { proxyV1 } from "@/lib/v1proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "25";

  // Default: /v1/transactions?limit=... (discovered to be correct for IPPAN API)
  const pathTemplate = (process.env.TX_RECENT_UPSTREAM_PATH ?? "/v1/transactions?limit={limit}").trim();

  // Replace {limit} placeholder with actual limit value
  const forcePath = pathTemplate.replace(/\{limit\}/g, encodeURIComponent(limit));

  // Delegate to existing hardened proxy logic with forced path
  return proxyV1(req, { forcePath });
}
