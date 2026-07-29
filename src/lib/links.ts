// Client-safe helpers (no secrets). The public league id can be overridden with
// NEXT_PUBLIC_ESPN_LEAGUE_ID; otherwise it defaults to the Cleveland Guys league.
export const PUBLIC_LEAGUE_ID =
  process.env.NEXT_PUBLIC_ESPN_LEAGUE_ID || "2110005";

export function espnLeagueUrl(path: "league" | "standings" | "scoreboard" = "league"): string {
  const base = "https://fantasy.espn.com/football";
  return `${base}/${path}?leagueId=${PUBLIC_LEAGUE_ID}`;
}
