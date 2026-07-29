import { NextResponse } from "next/server";
import { getSchedule, getLeagueConfig } from "@/lib/espn";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getSchedule();
  const { leagueId, season } = getLeagueConfig();
  return NextResponse.json(
    { ...result, leagueId, season },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } },
  );
}
