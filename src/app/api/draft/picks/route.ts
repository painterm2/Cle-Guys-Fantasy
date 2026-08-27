import { NextResponse } from "next/server";
import { getDraftPicks } from "@/lib/espn";

export const dynamic = "force-dynamic";

// Picks only — small enough to poll every few seconds during a live draft.
export async function GET() {
  const result = await getDraftPicks();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
