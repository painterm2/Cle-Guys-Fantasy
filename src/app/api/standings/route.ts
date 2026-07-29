import { NextResponse } from "next/server";
import { getStandings, getLeagueConfig } from "@/lib/espn";

// Run on every request (upstream ESPN calls are cached 60s inside getStandings).
export const dynamic = "force-dynamic";

// Server-side proxy so ESPN cookies never touch the browser.
export async function GET() {
  const result = await getStandings();
  const { leagueId, season } = getLeagueConfig();
  return NextResponse.json(
    { ...result, leagueId, season },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } },
  );
}
