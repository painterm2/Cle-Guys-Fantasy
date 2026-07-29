import { TEAMS } from "./teams";

// ---------------------------------------------------------------------------
// League content that lives on THIS site (not in ESPN): rules, punishment
// history, polls, vacation plans, HOF, etc. Edit these freely — they're the
// social/organizational layer around the ESPN-hosted league.
// ---------------------------------------------------------------------------

export const SEASON_LABEL = "SEASON 8 · 2026";
export const SEASON_YEAR = 2026;

export const statCards = [
  { label: "SEASONS RUNNING", value: "8", sub: "since 2019" },
  { label: "CURRENT CHAMPION", value: TEAMS[2], sub: "2025 title" },
  { label: "OPEN VOTES", value: "2", sub: "punishment + vacation" },
  { label: "DRAFT VACATION", value: "2028", sub: "location TBD" },
];

export const feedItems = [
  { who: "Peter", what: "is officially serving the jersey punishment for 2026.", when: "2 days ago", teamIndex: null as number | null },
  { who: TEAMS[5], what: "posted a new trade ask on the board.", when: "3 days ago", teamIndex: 5 },
  { who: TEAMS[1], what: "voted on the 2026 punishment poll.", when: "4 days ago", teamIndex: 1 },
  { who: TEAMS[8], what: "commented on the draft vacation thread.", when: "5 days ago", teamIndex: 8 },
  { who: TEAMS[0], what: "added a rule proposal for keeper eligibility.", when: "1 week ago", teamIndex: 0 },
];

export const currentPunishment = {
  eyebrow: "SERVING NOW — 2026 SEASON",
  text: "Peter wears his least favorite team's jersey every Sunday during fantasy season.",
  sub: "Sentenced for finishing 10th, 2025 season.",
};

export const ruleGroups = [
  {
    title: "ROSTER & KEEPERS",
    rules: [
      { num: "1.1", text: "Rosters carry 16 players, 9 starters, standard ESPN scoring." },
      { num: "1.2", text: "No keepers — full re-draft every season." },
      { num: "1.3", text: "Waiver claims process Wednesday nights at 9pm ET." },
    ],
  },
  {
    title: "DRAFT DAY",
    rules: [
      { num: "2.1", text: "Draft order decided by a video reveal, released before Labor Day." },
      { num: "2.2", text: "Snake draft, 90 seconds per pick." },
    ],
  },
  {
    title: "TRADES",
    rules: [
      { num: "3.1", text: "Trades must be posted on the Trade Board before submission to ESPN." },
      { num: "3.2", text: "League vote can veto a trade with a 2/3 majority within 48 hours." },
    ],
  },
  {
    title: "PUNISHMENT",
    rules: [
      { num: "4.1", text: "The last-place finisher in the REGULAR SEASON (playoffs not included) serves the punishment the following season." },
      { num: "4.2", text: "Punishment is chosen by league vote before Week 1." },
    ],
  },
];

// The punishment description per season (ESPN can't know these — edit freely).
// The last-place LOSER for each year is pulled live from ESPN; this map only
// supplies what the punishment actually was. Keys are the season year.
export const punishmentDescriptions: Record<string, string> = {
  "2025": "Wears his least favorite team's jersey every Sunday, all season.",
  "2024": "Beer 5K — a can every kilometer, all 5.",
  "2023": "Beer 5K — a can every kilometer, all 5.",
};

export const punishmentHistory = [
  { year: "2025", loser: "Peter", punishment: "Wears his least favorite team's jersey every Sunday, all season." },
  { year: "2024", loser: TEAMS[6], punishment: "Beer 5K — a can every kilometer, all 5." },
  { year: "2023", loser: TEAMS[3], punishment: "Beer 5K — a can every kilometer, all 5." },
  { year: "2022", loser: TEAMS[7], punishment: "No punishment assigned this year." },
  { year: "2021", loser: TEAMS[4], punishment: "No punishment assigned this year." },
  { year: "2020", loser: TEAMS[9], punishment: "No punishment assigned this year." },
  { year: "2019", loser: TEAMS[1], punishment: "No punishment assigned this year." },
];

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

// Only real draft-day videos we have on file. Add more as they're recorded.
export const draftVideos = [
  { year: "2025", title: "Draft Order Announcement", youtubeId: "U5BXm38ZU54", start: 488 },
];

export const POSITIONS = ["QB", "RB", "WR", "TE", "FLEX", "DEF", "K"] as const;

// Trade board posts keyed by team index. Missing index = empty board.
export const tradePosts: Record<
  number,
  { looking: string[]; offering: string[]; players: string[]; updated: string }
> = {
  5: { looking: ["RB", "FLEX"], offering: ["WR", "K"], players: ["J. Cook (RB)"], updated: "Updated 2h ago" },
  8: { looking: ["TE"], offering: ["WR", "FLEX"], players: [], updated: "Updated 1 day ago" },
  2: { looking: ["RB"], offering: ["WR"], players: ["D. Metcalf (WR)", "C. Kupp (WR)"], updated: "Updated 2 days ago" },
  0: { looking: ["QB"], offering: ["RB", "K"], players: [], updated: "Updated 3 days ago" },
  6: { looking: ["DEF"], offering: ["QB"], players: ["G. Smith (QB)"], updated: "Updated 5 days ago" },
};

export const activePolls = [
  {
    question: "What's the 2026 loser's punishment?",
    closes: "Closes in 4 days",
    options: [
      { label: "Beer 5K, round 3", pct: 44 },
      { label: "Shave your head on stream", pct: 33 },
      { label: "Commissioner picks something worse", pct: 23 },
    ],
  },
  {
    question: "2028 draft vacation destination",
    closes: "Closes in 9 days",
    options: [
      { label: "Nashville", pct: 58 },
      { label: "Las Vegas", pct: 42 },
    ],
  },
];

export const vacationOptions = [
  { city: "Nashville", pitch: "Central location, honky-tonks, easy flights for everyone.", votes: 6 },
  { city: "Las Vegas", pitch: "Bigger swing, bigger stakes, a real draft-day spectacle.", votes: 4 },
];

export const vacationThread = [
  { who: "Kyle Krueger", msg: "Vegas for the bigger stage, Nashville for the wallet." },
  { who: "Tito .", msg: "Whoever wins should host the draft table setup." },
  { who: "Herbie: Fully (un)Loaded", msg: "Need to lock dates before flights spike." },
  { who: "The Rice Cookers", msg: "Vote closes in 9 days, get your picks in." },
];

export const champions = [
  { year: "2025", team: TEAMS[2], teamIndex: 2 },
  { year: "2024", team: TEAMS[0], teamIndex: 0 },
  { year: "2023", team: TEAMS[5], teamIndex: 5 },
  { year: "2022", team: TEAMS[1], teamIndex: 1 },
  { year: "2021", team: TEAMS[8], teamIndex: 8 },
  { year: "2020", team: TEAMS[3], teamIndex: 3 },
  { year: "2019", team: TEAMS[6], teamIndex: 6 },
];

export const records = [
  { label: "Most points in a season", value: `${TEAMS[2]} — 1,842 (2025)` },
  { label: "Most championships", value: `${TEAMS[2]} — 2 titles` },
  { label: "Worst single-week score", value: `${TEAMS[9]} — 42.1 pts (2022)` },
  { label: "Longest playoff drought", value: `${TEAMS[4]} — 3 seasons` },
  { label: "Most punishments served", value: "Tied at 1 each" },
];

// Fallback standings used before the season starts or when ESPN isn't wired up.
export const fallbackStandings = TEAMS.map((name, i) => ({
  rank: i + 1,
  name,
  wins: Math.max(1, 9 - i),
  losses: Math.min(9, i + 1),
  ties: 0,
  pointsFor: 1480 - i * 38,
}));
