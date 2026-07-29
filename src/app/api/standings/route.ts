import { NextRequest, NextResponse } from "next/server";
import { getSeasonStandings, getLeagueConfig, availableSeasons } from "@/lib/espn";

// Run on every request (upstream ESPN calls are cached inside the client).
export const dynamic = "force-dynamic";

// Server-side proxy so ESPN cookies never touch the browser.
// GET ?season=YYYY for a past season; defaults to the configured season.
export async function GET(req: NextRequest) {
  const { leagueId, season: current } = getLeagueConfig();
  const seasons = availableSeasons();

  const asked = Number(new URL(req.url).searchParams.get("season"));
  const season = seasons.includes(asked) ? asked : current;

  const result = await getSeasonStandings(season);
  const isPast = season !== current;

  return NextResponse.json(
    { ...result, leagueId, season, seasons },
    {
      headers: {
        // Finished seasons never change; the live one needs to stay fresh.
        "Cache-Control": isPast
          ? "s-maxage=86400, stale-while-revalidate=172800"
          : "s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
