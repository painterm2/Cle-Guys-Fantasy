import { ownerRealNames } from "./leagueData";

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
  /** Manager behind the team, when we can resolve it. */
  owner?: string;
  /** ESPN's end-of-season rank, for finished seasons. */
  finalRank?: number;
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

export const FIRST_SEASON = 2019; // Cleveland Guys started in 2019

export interface SeasonEntry {
  year: number;
  team: string;
  owner: string; // the manager — stable even when the team name changes year to year
  logo: string | null; // that season's team logo, straight from ESPN
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

const normTeam = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();

// Team name (normalized) -> real manager name, from the editable ownerRealNames.
const REAL_BY_TEAM_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(ownerRealNames).map(([team, real]) => [normTeam(team), real]),
);

/**
 * Resolve a team to its real manager name. Order of preference:
 *  1. realBySwid — the manager's stable ESPN id, learned from any season whose
 *     team name matched ownerRealNames (survives team-name changes).
 *  2. A direct team-name match this season.
 *  3. The ESPN account (displayName / first+last) as a last resort.
 */
function ownerName(team: any, members: any[], realBySwid: Record<string, string>): string {
  const ownerId = Array.isArray(team?.owners) ? team.owners[0] : undefined;
  if (ownerId && realBySwid[ownerId]) return realBySwid[ownerId];

  const byName = REAL_BY_TEAM_NAME[normTeam(teamName(team, ""))];
  if (byName) return byName;

  const member = ownerId ? members.find((m) => m?.id === ownerId) : undefined;
  if (member) {
    const full = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
    return (member.displayName || full || "").trim() || "Unknown owner";
  }
  return "Unknown owner";
}

/** First pass: learn each manager's stable ESPN id from any season whose team name matches. */
function buildRealBySwid(seasons: { league: any }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { league } of seasons) {
    for (const t of league?.teams ?? []) {
      const ownerId = Array.isArray(t?.owners) ? t.owners[0] : undefined;
      if (!ownerId || map[ownerId]) continue;
      const real = REAL_BY_TEAM_NAME[normTeam(teamName(t, ""))];
      if (real) map[ownerId] = real;
    }
  }
  return map;
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

    // Learn stable owner ids first so real names carry across team renames.
    const realBySwid = buildRealBySwid(seasons);

    const champions: SeasonEntry[] = [];
    const lastPlace: SeasonEntry[] = [];
    const titleCount: Record<string, number> = {};
    const lastCount: Record<string, number> = {};
    let bestSeason = { team: "", year: 0, points: 0 };
    let completed = 0;

    for (const { y, league } of seasons) {
      const teams: any[] = league?.teams ?? [];
      const members: any[] = league?.members ?? [];
      if (teams.length === 0) continue;

      // A season is "complete" once ESPN has assigned a final #1.
      const champ = teams.find((t) => t.rankCalculatedFinal === 1);
      if (!champ) continue;
      completed++;

      const champOwner = ownerName(champ, members, realBySwid);
      champions.push({ year: y, team: teamName(champ, `Team ${champ.id}`), owner: champOwner, logo: normalizeLogo(champ.logo) });
      // Tally titles by the manager (stable) rather than the team name (changes).
      titleCount[champOwner] = (titleCount[champOwner] ?? 0) + 1;

      const loser = lastPlaceTeam(teams);
      if (loser) {
        const loserOwner = ownerName(loser, members, realBySwid);
        lastPlace.push({ year: y, team: teamName(loser, `Team ${loser.id}`), owner: loserOwner, logo: normalizeLogo(loser.logo) });
        lastCount[loserOwner] = (lastCount[loserOwner] ?? 0) + 1;
      }

      for (const t of teams) {
        const pf = t.record?.overall?.pointsFor ?? 0;
        if (pf > bestSeason.points) bestSeason = { team: ownerName(t, members, realBySwid), year: y, points: pf };
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

// ---------------------------------------------------------------------------
// League settings → the Rules page. Pulls mSettings and renders the real
// configuration (roster, scoring, playoffs, waivers, trades) so the rules
// on the site always match ESPN.
// ---------------------------------------------------------------------------

const SLOT_NAMES: Record<number, string> = {
  0: "QB", 1: "TQB", 2: "RB", 3: "RB/WR", 4: "WR", 5: "WR/TE", 6: "TE",
  7: "OP", 16: "D/ST", 17: "K", 20: "Bench", 21: "IR", 23: "FLEX",
};

export interface SettingsGroup {
  title: string;
  rules: { num: string; text: string }[];
}

function fmtSlots(counts: Record<string, number> | undefined, bench: boolean): string {
  if (!counts) return "";
  const parts: string[] = [];
  for (const [slot, n] of Object.entries(counts)) {
    const id = Number(slot);
    const isBench = id === 20 || id === 21;
    if (!n || isBench !== bench) continue;
    parts.push(`${n} ${SLOT_NAMES[id] ?? `Slot ${id}`}`);
  }
  return parts.join(", ");
}

export async function getLeagueSettings(): Promise<EspnResult<SettingsGroup[]>> {
  const needsCreds = !hasCredentials();
  try {
    const json = await fetchLeague(["mSettings"]);
    const s = json?.settings ?? {};
    const groups: SettingsGroup[] = [];
    const push = (title: string, texts: string[]) => {
      if (texts.length === 0) return;
      const gi = groups.length + 1;
      groups.push({ title, rules: texts.map((text, i) => ({ num: `${gi}.${i + 1}`, text })) });
    };

    // Roster
    const starters = fmtSlots(s.rosterSettings?.lineupSlotCounts, false);
    const benchStr = fmtSlots(s.rosterSettings?.lineupSlotCounts, true);
    const roster: string[] = [];
    if (starters) roster.push(`Starting lineup: ${starters}.`);
    if (benchStr) roster.push(`Reserves: ${benchStr}.`);
    if (s.size) roster.push(`${s.size}-team league, full re-draft each season.`);
    push("ROSTER", roster);

    // Scoring — PPR value comes from stat 53 (receptions)
    const scoring: string[] = [];
    const items: any[] = s.scoringSettings?.scoringItems ?? [];
    const rec = items.find((it) => it.statId === 53);
    const recPts = rec?.pointsOverrides?.[16] ?? rec?.points;
    if (recPts != null) {
      const label = recPts === 1 ? "Full PPR" : recPts === 0.5 ? "Half PPR" : recPts === 0 ? "Standard (no PPR)" : `${recPts} pts per reception`;
      scoring.push(`${label} scoring.`);
    }
    scoring.push("Head-to-head points, per ESPN scoring settings.");
    push("SCORING", scoring);

    // Schedule & playoffs
    const sched = s.scheduleSettings ?? {};
    const schedule: string[] = [];
    if (sched.matchupPeriodCount) schedule.push(`${sched.matchupPeriodCount}-week regular season.`);
    if (sched.playoffTeamCount) schedule.push(`${sched.playoffTeamCount} teams make the playoffs.`);
    if (sched.playoffMatchupPeriodLength) {
      schedule.push(`Playoff rounds are ${sched.playoffMatchupPeriodLength} week${sched.playoffMatchupPeriodLength > 1 ? "s" : ""} each.`);
    }
    push("SCHEDULE & PLAYOFFS", schedule);

    // Waivers
    const acq = s.acquisitionSettings ?? {};
    const waivers: string[] = [];
    if (acq.isUsingAcquisitionBudget && acq.acquisitionBudget) {
      waivers.push(`FAAB waivers — $${acq.acquisitionBudget} budget per season.`);
    } else if (acq.acquisitionType) {
      waivers.push(`Waiver claims process via ESPN (${String(acq.acquisitionType).replace(/_/g, " ").toLowerCase()}).`);
    }
    push("WAIVERS", waivers);

    // Trades
    const tr = s.tradeSettings ?? {};
    const trades: string[] = [];
    if (tr.deadlineDate) {
      trades.push(`Trade deadline: ${new Date(tr.deadlineDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`);
    }
    if (tr.vetoVotesRequired) trades.push(`${tr.vetoVotesRequired} votes required to veto a trade.`);
    if (tr.revisionHours) trades.push(`Trades process after a ${tr.revisionHours}-hour review window.`);
    push("TRADES", trades);

    return { status: "live", data: groups, needsCredentials: false };
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
// Standings for any season — the current one from the live endpoint, past ones
// from leagueHistory. Lets the standings page look back through the years.
// ---------------------------------------------------------------------------

/** Seasons we can show standings for, newest first. */
export function availableSeasons(): number[] {
  const end = currentSeason();
  const years: number[] = [];
  for (let y = end; y >= FIRST_SEASON; y--) years.push(y);
  return years;
}

export async function getSeasonStandings(year: number): Promise<EspnResult<TeamStanding[]>> {
  const needsCreds = !hasCredentials();

  // The live endpoint covers the current season; older ones need leagueHistory.
  if (year === currentSeason()) {
    return getStandings();
  }

  try {
    const league = await fetchHistorySeason(year);
    const teams: any[] = league?.teams ?? [];
    const members: any[] = league?.members ?? [];
    if (teams.length === 0) {
      return { status: "error", data: [], needsCredentials: needsCreds, error: `No ESPN data for ${year}.` };
    }

    // Resolve managers using this season's own team names.
    const realBySwid = buildRealBySwid([{ league }]);

    const rows: TeamStanding[] = teams.map((t, i) => {
      const overall = t.record?.overall ?? {};
      return {
        teamId: t.id,
        rank: t.rankCalculatedFinal || t.playoffSeed || i + 1,
        finalRank: t.rankCalculatedFinal || undefined,
        owner: ownerName(t, members, realBySwid),
        name: teamName(t, `Team ${t.id}`),
        abbrev: t.abbrev || "",
        logo: normalizeLogo(t.logo),
        wins: overall.wins ?? 0,
        losses: overall.losses ?? 0,
        ties: overall.ties ?? 0,
        pointsFor: Math.round((overall.pointsFor ?? 0) * 10) / 10,
        pointsAgainst: Math.round((overall.pointsAgainst ?? 0) * 10) / 10,
      };
    });

    // Finished seasons: order by ESPN's final standing. Fall back to record.
    const anyFinal = rows.some((r) => r.finalRank);
    rows.sort((a, b) =>
      anyFinal
        ? (a.finalRank ?? 99) - (b.finalRank ?? 99)
        : b.wins - a.wins || b.pointsFor - a.pointsFor,
    );

    return { status: "live", data: rows.map((r, i) => ({ ...r, rank: r.finalRank ?? i + 1 })), needsCredentials: false };
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
// Draft order — pulled live from ESPN so the site shows whatever order the
// league actually has set. ESPN keeps it in two places: `draftSettings.
// pickOrder` (the order the commish set, before the draft happens) and
// `draftDetail.picks` (what actually happened, once it's done). We prefer the
// set order and fall back to round 1 of a completed draft.
// ---------------------------------------------------------------------------

export interface DraftSlot {
  /** 1-based first-round pick number. */
  pick: number;
  teamId: number;
  team: string;
  /** The manager behind the team, when we can resolve one. */
  owner?: string;
  abbrev: string;
  logo: string | null;
}

export interface DraftOrderData {
  order: DraftSlot[];
  /** ESPN's draft type, e.g. "SNAKE" or "AUCTION". */
  type?: string;
  /** Scheduled draft date, ISO, when ESPN has one set. */
  date?: string;
  /** true once the draft has been completed on ESPN. */
  drafted: boolean;
  inProgress: boolean;
  /** Where the order came from — the set pick order, or a finished draft. */
  source: "pickOrder" | "picks" | "none";
}

const EMPTY_DRAFT: DraftOrderData = { order: [], drafted: false, inProgress: false, source: "none" };

export async function getDraftOrder(): Promise<EspnResult<DraftOrderData>> {
  const needsCreds = !hasCredentials();
  try {
    const json = await fetchLeague(["mDraftDetail", "mSettings", "mTeam"]);
    const teams: any[] = json?.teams ?? [];
    const members: any[] = json?.members ?? [];
    const byId = new Map<number, any>(teams.map((t) => [t.id, t]));
    // Same manager-name resolution the rest of the site uses.
    const realBySwid = buildRealBySwid([{ league: json }]);

    const slotFor = (teamId: number, pick: number): DraftSlot => {
      const t = byId.get(teamId);
      const owner = t ? ownerName(t, members, realBySwid) : "";
      return {
        pick,
        teamId,
        team: t ? teamName(t, `Team ${teamId}`) : `Team ${teamId}`,
        owner: owner && owner !== "Unknown owner" ? owner : undefined,
        abbrev: t?.abbrev ?? "",
        logo: normalizeLogo(t?.logo),
      };
    };

    const ds = json?.settings?.draftSettings ?? {};
    const detail = json?.draftDetail ?? {};

    let order: DraftSlot[] = [];
    let source: DraftOrderData["source"] = "none";

    const pickOrder: number[] = Array.isArray(ds.pickOrder)
      ? ds.pickOrder.filter((id: unknown) => typeof id === "number")
      : [];

    if (pickOrder.length > 0) {
      order = pickOrder.map((teamId, i) => slotFor(teamId, i + 1));
      source = "pickOrder";
    } else {
      // No order set, but a finished draft still tells us what it was.
      const round1: any[] = (detail.picks ?? [])
        .filter((p: any) => p?.roundId === 1 && p?.teamId)
        .sort(
          (a: any, b: any) =>
            (a.overallPickNumber ?? a.roundPickNumber ?? 0) - (b.overallPickNumber ?? b.roundPickNumber ?? 0),
        );
      if (round1.length > 0) {
        order = round1.map((p, i) => slotFor(p.teamId, p.roundPickNumber ?? i + 1));
        source = "picks";
      }
    }

    const when = Number(ds.date) > 0 ? new Date(Number(ds.date)).toISOString() : undefined;

    return {
      status: "live",
      data: {
        order,
        type: typeof ds.type === "string" ? ds.type : undefined,
        date: when,
        drafted: Boolean(detail.drafted),
        inProgress: Boolean(detail.inProgress),
        source,
      },
      needsCredentials: false,
    };
  } catch (err: any) {
    return {
      status: err?.code === "AUTH" ? "unconfigured" : "error",
      data: EMPTY_DRAFT,
      needsCredentials: err?.code === "AUTH" ? true : needsCreds,
      error: err?.message ?? "Unknown error",
    };
  }
}
