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
  record: string; // e.g. "5-2"
}

export type MatchupStatus = "upcoming" | "in_progress" | "final";

export interface Matchup {
  matchupPeriodId: number;
  home: MatchupSide;
  away: MatchupSide | null; // null for a bye
  winner: "home" | "away" | "tie" | "undecided";
  status: MatchupStatus;
}

export interface Schedule {
  currentWeek: number;
  weeks: number[];
  matchups: Matchup[]; // all weeks; filter by matchupPeriodId
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

function recordOf(t: any): string {
  const o = t?.record?.overall;
  if (!o) return "";
  const base = `${o.wins ?? 0}-${o.losses ?? 0}`;
  return o.ties ? `${base}-${o.ties}` : base;
}

// Turn ESPN's raw `schedule` array into normalized Matchup objects (all weeks).
function parseMatchups(json: any, currentWeek: number): Matchup[] {
  const teamsById = new Map<number, any>();
  for (const t of json?.teams ?? []) teamsById.set(t.id, t);

  const side = (raw: any): MatchupSide | null => {
    if (!raw || raw.teamId == null || raw.teamId === 0) return null;
    const t = teamsById.get(raw.teamId);
    return {
      teamId: raw.teamId,
      name: t ? teamName(t, `Team ${raw.teamId}`) : `Team ${raw.teamId}`,
      abbrev: t?.abbrev ?? "",
      logo: normalizeLogo(t?.logo),
      score: Math.round((raw.totalPoints ?? 0) * 10) / 10,
      record: t ? recordOf(t) : "",
    };
  };

  const schedule: any[] = json?.schedule ?? [];
  return schedule.map((m) => {
    const home = side(m.home);
    const away = side(m.away);

    let winner: Matchup["winner"] = "undecided";
    if (m.winner === "HOME") winner = "home";
    else if (m.winner === "AWAY") winner = "away";
    else if (m.winner === "TIE") winner = "tie";

    const week = m.matchupPeriodId;
    const anyScore = (home?.score ?? 0) > 0 || (away?.score ?? 0) > 0;
    let matchStatus: MatchupStatus;
    if (winner !== "undecided") matchStatus = "final";
    else if (week < currentWeek) matchStatus = "final";
    else if (week === currentWeek && anyScore) matchStatus = "in_progress";
    else matchStatus = "upcoming";

    return {
      matchupPeriodId: week,
      home: home ?? { teamId: -1, name: "TBD", abbrev: "", logo: null, score: 0, record: "" },
      away,
      winner,
      status: matchStatus,
    };
  });
}

function currentWeekOf(json: any): number {
  return json?.scoringPeriodId ?? json?.status?.currentMatchupPeriod ?? 0;
}

/** Current-week matchups only — used by the compact home/standings widget. */
export async function getScoreboard(): Promise<EspnResult<Matchup[]>> {
  const needsCreds = !hasCredentials();
  try {
    const json = await fetchLeague(["mScoreboard", "mTeam"]);
    const week = currentWeekOf(json);
    const matchups = parseMatchups(json, week).filter((m) => m.matchupPeriodId === week);
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

/** Full-season schedule with scores — used by the Matchups page. */
export async function getSchedule(): Promise<EspnResult<Schedule>> {
  const needsCreds = !hasCredentials();
  const empty: Schedule = { currentWeek: 0, weeks: [], matchups: [] };
  try {
    const json = await fetchLeague(["mScoreboard", "mTeam", "mSettings"]);
    const currentWeek = currentWeekOf(json);
    const matchups = parseMatchups(json, currentWeek);
    const weeks = Array.from(new Set(matchups.map((m) => m.matchupPeriodId))).sort((a, b) => a - b);
    return {
      status: "live",
      data: { currentWeek, weeks, matchups },
      needsCredentials: false,
      week: currentWeek,
    };
  } catch (err: any) {
    return {
      status: err?.code === "AUTH" ? "unconfigured" : "error",
      data: empty,
      needsCredentials: err?.code === "AUTH" ? true : needsCreds,
      error: err?.message ?? "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// League history — champions + regular-season last-place finishers per season,
// pulled from ESPN's leagueHistory endpoint (one call per season). Used to
// replace hand-entered History / Hall of Shame data with the real record.
// ---------------------------------------------------------------------------

const FIRST_SEASON = 2019; // Cleveland Guys started in 2019

export interface SeasonEntry {
  year: number;
  team: string;
}

export interface HistoryData {
  champions: SeasonEntry[]; // newest first
  lastPlace: SeasonEntry[]; // newest first — regular-season last place
  records: { label: string; value: string }[];
  seasonsCount: number;
}

const EMPTY_HISTORY: HistoryData = { champions: [], lastPlace: [], records: [], seasonsCount: 0 };

/** Fetch a single past season via the leagueHistory endpoint. */
async function fetchHistorySeason(year: number): Promise<any | null> {
  const cfg = getLeagueConfig();
  const params = new URLSearchParams();
  params.append("seasonId", String(year));
  for (const v of ["mTeam", "mSettings"]) params.append("view", v);
  const url = `${API_HOST}/apis/v3/games/ffl/leagueHistory/${cfg.leagueId}?${params}`;

  const cookie = cookieHeader(cfg);
  const res = await fetch(url, {
    headers: { accept: "application/json", ...(cookie ? { cookie } : {}) },
    next: { revalidate: 3600 }, // history changes rarely — cache an hour
  });

  if (res.status === 401) {
    const err = new Error("ESPN returned 401 for league history — cookies missing or expired.");
    (err as any).code = "AUTH";
    throw err;
  }
  if (!res.ok) return null; // season not available (e.g. before the league existed)

  const json = await res.json();
  const league = Array.isArray(json) ? json[0] : json;
  return league ?? null;
}

/** Pick the regular-season last-place team: highest playoff seed, or worst record. */
function lastPlaceTeam(teams: any[]): any | null {
  const seeded = teams.filter((t) => (t.playoffSeed ?? 0) > 0);
  if (seeded.length) {
    return seeded.reduce((worst, t) => (t.playoffSeed > worst.playoffSeed ? t : worst));
  }
  if (teams.length === 0) return null;
  return [...teams].sort(
    (a, b) =>
      (a.record?.overall?.wins ?? 0) - (b.record?.overall?.wins ?? 0) ||
      (a.record?.overall?.pointsFor ?? 0) - (b.record?.overall?.pointsFor ?? 0),
  )[0];
}

export async function getLeagueHistory(): Promise<EspnResult<HistoryData>> {
  const needsCreds = !hasCredentials();
  const end = currentSeason();
  const years: number[] = [];
  for (let y = FIRST_SEASON; y <= end; y++) years.push(y);

  try {
    const seasons = await Promise.all(
      years.map((y) =>
        fetchHistorySeason(y)
          .then((league) => ({ y, league }))
          .catch((err) => {
            if (err?.code === "AUTH") throw err;
            return { y, league: null };
          }),
      ),
    );

    const champions: SeasonEntry[] = [];
    const lastPlace: SeasonEntry[] = [];
    const titleCount: Record<string, number> = {};
    const lastCount: Record<string, number> = {};
    let bestSeason = { team: "", year: 0, points: 0 };
    let completed = 0;

    for (const { y, league } of seasons) {
      const teams: any[] = league?.teams ?? [];
      if (teams.length === 0) continue;

      // A season is "complete" once ESPN has assigned a final #1.
      const champ = teams.find((t) => t.rankCalculatedFinal === 1);
      if (!champ) continue;
      completed++;

      const champName = teamName(champ, `Team ${champ.id}`);
      champions.push({ year: y, team: champName });
      titleCount[champName] = (titleCount[champName] ?? 0) + 1;

      const loser = lastPlaceTeam(teams);
      if (loser) {
        const loserName = teamName(loser, `Team ${loser.id}`);
        lastPlace.push({ year: y, team: loserName });
        lastCount[loserName] = (lastCount[loserName] ?? 0) + 1;
      }

      for (const t of teams) {
        const pf = t.record?.overall?.pointsFor ?? 0;
        if (pf > bestSeason.points) bestSeason = { team: teamName(t, `Team ${t.id}`), year: y, points: pf };
      }
    }

    if (completed === 0) {
      return {
        status: needsCreds ? "unconfigured" : "error",
        data: EMPTY_HISTORY,
        needsCredentials: needsCreds,
        error: "ESPN returned no completed seasons.",
      };
    }

    champions.sort((a, b) => b.year - a.year);
    lastPlace.sort((a, b) => b.year - a.year);

    const records: { label: string; value: string }[] = [];
    const topTitles = Object.entries(titleCount).sort((a, b) => b[1] - a[1])[0];
    if (topTitles) {
      records.push({ label: "Most championships", value: `${topTitles[0]} — ${topTitles[1]} ${topTitles[1] === 1 ? "title" : "titles"}` });
    }
    if (bestSeason.points > 0) {
      records.push({ label: "Most points in a season", value: `${bestSeason.team} — ${Math.round(bestSeason.points).toLocaleString()} (${bestSeason.year})` });
    }
    const topLast = Object.entries(lastCount).sort((a, b) => b[1] - a[1])[0];
    if (topLast && topLast[1] > 1) {
      records.push({ label: "Most last-place finishes", value: `${topLast[0]} — ${topLast[1]} times` });
    }

    return {
      status: "live",
      data: { champions, lastPlace, records, seasonsCount: completed },
      needsCredentials: false,
    };
  } catch (err: any) {
    return {
      status: err?.code === "AUTH" ? "unconfigured" : "error",
      data: EMPTY_HISTORY,
      needsCredentials: err?.code === "AUTH" ? true : needsCreds,
      error: err?.message ?? "Unknown error",
    };
  }
}
