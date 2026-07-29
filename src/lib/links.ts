// Client-safe helpers (no secrets). The public league id can be overridden with
// NEXT_PUBLIC_ESPN_LEAGUE_ID; otherwise it defaults to the Cleveland Guys league.
export const PUBLIC_LEAGUE_ID =
  process.env.NEXT_PUBLIC_ESPN_LEAGUE_ID || "2110005";

// ESPN nests standings/scoreboard under /football/league/... — the bare
// /football/standings path 404s.
const PATHS: Record<"league" | "standings" | "scoreboard", string> = {
  league: "league",
  standings: "league/standings",
  scoreboard: "league/scoreboard",
};

export function espnLeagueUrl(path: "league" | "standings" | "scoreboard" = "league"): string {
  return `https://fantasy.espn.com/football/${PATHS[path]}?leagueId=${PUBLIC_LEAGUE_ID}`;
}
