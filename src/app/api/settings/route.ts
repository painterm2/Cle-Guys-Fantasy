import { NextResponse } from "next/server";
import { getLeagueSettings } from "@/lib/espn";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getLeagueSettings();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
  });
}
