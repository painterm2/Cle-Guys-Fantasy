import { NextRequest, NextResponse } from "next/server";
import { getDraftBoard } from "@/lib/espn";

export const dynamic = "force-dynamic";

// Live draft board. Polled every few seconds while a draft is running, so it
// never caches — a stale board during a draft is worse than no board.
export async function GET(req: NextRequest) {
  const limit = Math.min(600, Math.max(50, Number(new URL(req.url).searchParams.get("limit")) || 300));
  const result = await getDraftBoard(limit);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
