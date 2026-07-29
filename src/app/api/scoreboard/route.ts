import { NextResponse } from "next/server";
import { getScoreboard, getLeagueConfig } from "@/lib/espn";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getScoreboard();
  const { leagueId, season } = getLeagueConfig();
  return NextResponse.json(
    { ...result, leagueId, season },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } },
  );
}
