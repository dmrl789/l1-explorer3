/* src/app/v1/[...path]/route.ts */
import { NextRequest } from "next/server";
import { proxyV1 } from "@/lib/v1proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyV1(req);
}

export async function POST(req: NextRequest) {
  return proxyV1(req);
}

export async function PUT(req: NextRequest) {
  return proxyV1(req);
}

export async function DELETE(req: NextRequest) {
  return proxyV1(req);
}

export async function PATCH(req: NextRequest) {
  return proxyV1(req);
}
