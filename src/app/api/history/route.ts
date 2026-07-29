import { NextResponse } from "next/server";
import { getLeagueHistory, getLeagueConfig } from "@/lib/espn";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getLeagueHistory();
  const { leagueId } = getLeagueConfig();
  return NextResponse.json(
    { ...result, leagueId },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } },
  );
}
