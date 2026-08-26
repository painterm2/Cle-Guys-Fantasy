import { NextResponse } from "next/server";
import { getDraftInfo } from "@/lib/espn";

export const dynamic = "force-dynamic";

// Public: the scheduled draft time only, for the league-wide countdown.
export async function GET() {
  const result = await getDraftInfo();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" },
  });
}
