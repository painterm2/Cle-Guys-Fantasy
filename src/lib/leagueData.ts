import { TEAMS } from "./teams";

// ---------------------------------------------------------------------------
// League content that lives on THIS site (not in ESPN): rules, punishment
// descriptions, polls, vacation plans, etc. Edit these freely — they're the
// social/organizational layer around the ESPN-hosted league.
//
// This file has been CLEARED of placeholder/demo content so it can be filled
// in for real. Champions, standings, and last-place finishers come live from
// ESPN; everything below is yours to populate.
// ---------------------------------------------------------------------------

export const SEASON_LABEL = "SEASON 8 · 2026";
export const SEASON_YEAR = 2026;

// Small dashboard tiles on the home page. Edit values/labels as you like.
export const statCards = [
  { label: "SEASONS RUNNING", value: "8", sub: "since 2019" },
  { label: "TEAMS", value: "10", sub: "managers" },
  { label: "2026 PUNISHMENT", value: "TBD", sub: "set before Week 1" },
  { label: "DRAFT ORDER", value: "TBD", sub: "revealed on draft day" },
];

// League activity feed on the home page. Add items as things happen.
export const feedItems: { who: string; what: string; when: string; teamIndex: number | null }[] = [];

// The punishment currently being served. Fill in once it's decided.
export const currentPunishment = {
  eyebrow: "2026 SEASON",
  text: "",
  sub: "",
};

// League rules. Edit the text, add/remove rules and groups as needed.
export const ruleGroups = [
  {
    title: "PUNISHMENT",
    rules: [
      { num: "1.1", text: "The last-place finisher in the REGULAR SEASON (playoffs not included) serves the punishment the following season." },
      { num: "1.2", text: "Punishment is chosen by league vote before Week 1." },
    ],
  },
];

// The punishment description per season (ESPN can't know these — fill these in).
// The last-place LOSER for each year is pulled live from ESPN; this map only
// supplies what the punishment actually was. Keys are the season year, e.g.
//   "2025": "Wears his least favorite team's jersey every Sunday.",
export const punishmentDescriptions: Record<string, string> = {};

// Fallback Hall of Shame, only used if ESPN history can't be reached. The real
// list comes live from ESPN. Leave empty unless you want a manual fallback.
export const punishmentHistory: { year: string; loser: string; punishment: string }[] = [];

// Real manager names, keyed by a team name they've used. ESPN only stores the
// account username + whatever the team is called that season; this maps a team
// name back to the actual person. We learn each manager's stable ESPN id from
// any season where one of these names matches, then use the real name for ALL
// their seasons — even years the team was called something else. To add a
// manager, list ANY team name they've used → their real name.
export const ownerRealNames: Record<string, string> = {
  "HUGE Football Team Guy": "Louis Thiery",
  "Sherwin Williams": "Michael Painter",
  "THE BEST MAN": "Seth Broz",
  "Tito .": "Sean Wallenhorst",
  "Kyle Krueger": "Kyle Krueger",
  "Herbie: Fully (un)Loaded": "Matt Redinger",
  "Nash over Ernie": "Brian Wallenhorst",
  "The Rice Cookers": "Mike Pichette",
  "Michael Painter : The Movie": "Andrew Rebholz",
  "Maker Bae-field": "Peter Trepke",
};

// This year's draft order hasn't been decided yet — leave empty so the page
// shows "not chosen" instead of a fake order. Fill in once it's set.
export const draftOrder: { pick: number; team: string }[] = [];

// Real draft-day videos we have on file. Add more as they're recorded.
export const draftVideos = [
  { year: "2025", title: "Draft Order Announcement", youtubeId: "U5BXm38ZU54", start: 488 },
];

export const POSITIONS = ["QB", "RB", "WR", "TE", "FLEX", "DEF", "K"] as const;

// Trade board posts keyed by team index. Empty = every board starts blank and
// editable on the Trades page.
export const tradePosts: Record<
  number,
  { looking: string[]; offering: string[]; players: string[]; updated: string }
> = {};

// Active polls on the Votes page. Add polls as needed, e.g.
//   { question: "…", closes: "Closes in 4 days",
//     options: [{ label: "Option A", pct: 0 }, { label: "Option B", pct: 0 }] }
export const activePolls: {
  question: string;
  closes: string;
  options: { label: string; pct: number }[];
}[] = [];

// Draft-vacation destination options. Add cities to open a vote.
export const vacationOptions: { city: string; pitch: string; votes: number }[] = [];

// Planning-thread seed messages (the thread is also editable live on the page).
export const vacationThread: { who: string; msg: string }[] = [];

// Fallback champions/records, only used if ESPN history can't be reached. The
// real lists come live from ESPN. Leave empty unless you want a manual fallback.
export const champions: { year: string; team: string; teamIndex?: number }[] = [];

export const records: { label: string; value: string }[] = [];

// Fallback standings shown before the season starts or when ESPN isn't wired
// up. Real team names, zeroed records — a clean preseason slate, not fake data.
export const fallbackStandings = TEAMS.map((name, i) => ({
  rank: i + 1,
  name,
  wins: 0,
  losses: 0,
  ties: 0,
  pointsFor: 0,
}));
