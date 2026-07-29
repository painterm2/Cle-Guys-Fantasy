// ---------------------------------------------------------------------------
// ESPN Fantasy Football v3 API client (server-side only).
//
// ESPN has no official public API. This uses the same read endpoint the ESPN
// web app uses. For a PRIVATE league you must supply two cookies from a logged
// in browser session — espn_s2 and SWID — via env vars. They are secrets and
// must never reach the browser, which is why every call here runs server-side.
//
//   Env vars (set in .env.local locally, and in Vercel project settings):
//     ESPN_LEAGUE_ID   your league id (default: the Cleveland Guys league)
//     ESPN_SEASON      season year (default: current season)
//     ESPN_S2          the espn_s2 cookie value (private leagues only)
//     ESPN_SWID        the SWID cookie value, braces included (private only)
// ---------------------------------------------------------------------------

const DEFAULT_LEAGUE_ID = "2110005"; // Cleveland Guys

const API_HOST = "https://lm-api-reads.fantasy.espn.com";

export type EspnStatus = "live" | "unconfigured" | "error";

export interface TeamStanding {
  teamId: number;
  rank: number;
  name: string;
  abbrev: string;
  logo: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface MatchupSide {
  teamId: number;
  name: string;
  abbrev: string;
  logo: string | null;
  score: number;
}

export interface Matchup {
  matchupPeriodId: number;
  home: MatchupSide;
  away: MatchupSide | null; // null for a bye
  winner: "home" | "away" | "undecided";
}

export interface EspnResult<T> {
  status: EspnStatus;
  data: T;
  /** true when the league requires auth cookies we don't have configured */
  needsCredentials: boolean;
  /** current scoring week, when known */
  week?: number;
  error?: string;
}

interface LeagueConfig {
  leagueId: string;
  season: number;
  espnS2?: string;
  swid?: string;
}

function currentSeason(): number {
  const now = new Date();
  // NFL fantasy playoffs run into January; treat Jan/Feb as the prior season.
  return now.getMonth() <= 1 ? now.getFullYear() - 1 : now.getFullYear();
}

export function getLeagueConfig(): LeagueConfig {
  return {
    leagueId: process.env.ESPN_LEAGUE_ID?.trim() || DEFAULT_LEAGUE_ID,
    season: Number(process.env.ESPN_SEASON) || currentSeason(),
    espnS2: process.env.ESPN_S2?.trim() || undefined,
    swid: process.env.ESPN_SWID?.trim() || undefined,
  };
}

export function hasCredentials(): boolean {
  const { espnS2, swid } = getLeagueConfig();
  return Boolean(espnS2 && swid);
}

function cookieHeader(cfg: LeagueConfig): string | undefined {
  if (!cfg.espnS2 || !cfg.swid) return undefined;
  // SWID is expected wrapped in braces; add them if the user pasted it without.
  const swid = cfg.swid.startsWith("{") ? cfg.swid : `{${cfg.swid}}`;
  return `espn_s2=${cfg.espnS2}; SWID=${swid}`;
}

/** Low-level fetch against the league endpoint with one or more views. */
async function fetchLeague(views: string[]): Promise<any> {
  const cfg = getLeagueConfig();
  const params = new URLSearchParams();
  for (const v of views) params.append("view", v);
  const url = `${API_HOST}/apis/v3/games/ffl/seasons/${cfg.season}/segments/0/leagues/${cfg.leagueId}?${params}`;

  const cookie = cookieHeader(cfg);
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(cookie ? { cookie } : {}),
    },
    // Cache on the server for 60s so we don't hammer ESPN on every request.
    next: { revalidate: 60 },
  });

  if (res.status === 401) {
    const err = new Error("ESPN returned 401 — this league is private and the espn_s2/SWID cookies are missing or expired.");
    (err as any).code = "AUTH";
    throw err;
  }
  if (!res.ok) {
    throw new Error(`ESPN API responded ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function teamName(t: any, fallback: string): string {
  // Newer responses expose `name`; older ones split location + nickname.
  const composed = [t.location, t.nickname].filter(Boolean).join(" ").trim();
  return (t.name || composed || fallback).trim();
}

function normalizeLogo(logo: unknown): string | null {
  return typeof logo === "string" && logo.startsWith("http") ? logo : null;
}

export async function getStandings(): Promise<EspnResult<TeamStanding[]>> {
  const needsCreds = !hasCredentials();
  try {
    const json = await fetchLeague(["mTeam", "mStandings"]);
    const teams: any[] = json?.teams ?? [];

    const standings: TeamStanding[] = teams
      .map((t, i) => {
        const overall = t.record?.overall ?? {};
        return {
          teamId: t.id,
          rank: t.playoffSeed || t.rankCalculatedFinal || i + 1,
          name: teamName(t, `Team ${t.id}`),
          abbrev: t.abbrev || "",
          logo: normalizeLogo(t.logo),
          wins: overall.wins ?? 0,
          losses: overall.losses ?? 0,
          ties: overall.ties ?? 0,
          pointsFor: Math.round((overall.pointsFor ?? 0) * 10) / 10,
          pointsAgainst: Math.round((overall.pointsAgainst ?? 0) * 10) / 10,
        };
      })
      // Sort by wins desc, then points-for desc — a sane default before games start.
      .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
      .map((t, i) => ({ ...t, rank: i + 1 }));

    return { status: "live", data: standings, needsCredentials: false };
  } catch (err: any) {
    return {
      status: err?.code === "AUTH" ? "unconfigured" : "error",
      data: [],
      needsCredentials: err?.code === "AUTH" ? true : needsCreds,
      error: err?.message ?? "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// NFL news — ESPN's PUBLIC site API. No cookies, no league id required. Great
// for a headline ticker.
// ---------------------------------------------------------------------------
export interface NewsItem {
  headline: string;
  description: string;
  link: string;
  published: string;
}

export async function getNews(): Promise<EspnResult<NewsItem[]>> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=30",
      { headers: { accept: "application/json" }, next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`ESPN news responded ${res.status}`);
    const json = await res.json();
    const items: NewsItem[] = (json?.articles ?? [])
      .map((a: any) => ({
        headline: a.headline ?? a.title ?? "",
        description: a.description ?? "",
        link: a.links?.web?.href ?? a.links?.mobile?.href ?? "",
        published: a.published ?? "",
      }))
      .filter((a: NewsItem) => a.headline);
    return { status: "live", data: items, needsCredentials: false };
  } catch (err: any) {
    return { status: "error", data: [], needsCredentials: false, error: err?.message ?? "Unknown error" };
  }
}

export async function getScoreboard(): Promise<EspnResult<Matchup[]>> {
  const needsCreds = !hasCredentials();
  try {
    const json = await fetchLeague(["mScoreboard", "mTeam"]);
    const week: number = json?.scoringPeriodId ?? json?.status?.currentMatchupPeriod ?? 0;

    const teamsById = new Map<number, any>();
    for (const t of json?.teams ?? []) teamsById.set(t.id, t);

    const side = (raw: any): MatchupSide | null => {
      if (!raw || raw.teamId == null) return null;
      const t = teamsById.get(raw.teamId);
      return {
        teamId: raw.teamId,
        name: t ? teamName(t, `Team ${raw.teamId}`) : `Team ${raw.teamId}`,
        abbrev: t?.abbrev ?? "",
        logo: normalizeLogo(t?.logo),
        score: Math.round((raw.totalPoints ?? 0) * 10) / 10,
      };
    };

    const schedule: any[] = json?.schedule ?? [];
    const matchups: Matchup[] = schedule
      .filter((m) => m.matchupPeriodId === week)
      .map((m) => {
        const home = side(m.home);
        const away = side(m.away);
        let winner: Matchup["winner"] = "undecided";
        if (m.winner === "HOME") winner = "home";
        else if (m.winner === "AWAY") winner = "away";
        return {
          matchupPeriodId: m.matchupPeriodId,
          home: home ?? { teamId: -1, name: "TBD", abbrev: "", logo: null, score: 0 },
          away,
          winner,
        };
      });

    return { status: "live", data: matchups, needsCredentials: false, week };
  } catch (err: any) {
    return {
      status: err?.code === "AUTH" ? "unconfigured" : "error",
      data: [],
      needsCredentials: err?.code === "AUTH" ? true : needsCreds,
      error: err?.message ?? "Unknown error",
    };
  }
}
