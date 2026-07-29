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
  { label: "DRAFT ORDER", value: "TBD", sub: "revealed before draft day" },
];

// The punishment currently being served. Fill in once it's decided.
export const currentPunishment = {
  eyebrow: "2026 SEASON",
  text: "",
  sub: "",
};

// House rules — the league's own rules that ESPN doesn't know about. The
// mechanical settings (roster, scoring, playoffs, waivers, trades) pull live
// from ESPN's League Settings on the Rules page; edit only house rules here.
export const ruleGroups = [
  {
    title: "PUNISHMENT",
    rules: [
      { num: "1.1", text: "The last-place finisher in the REGULAR SEASON (playoffs not included) serves the punishment the following season." },
      { num: "1.2", text: "Punishment is chosen by league vote before Week 1." },
    ],
  },
  {
    title: "WEEKLY STAKES",
    rules: [
      {
        num: "2.1",
        text: "$10 fine for not setting your lineup. Keeps everyone paying attention weekly — and it's kept people (even the commish) from punting their way out of the playoffs.",
      },
      {
        num: "2.2",
        text: "Lowest points each week buys the group parlay ($5–$10). Everyone else picks a leg, and any winnings get split between everyone except that week's lowest scorer.",
      },
    ],
  },
  {
    title: "BUY-IN & PAYOUTS",
    rules: [
      { num: "3.1", text: "$50 buy-in per team." },
      { num: "3.2", text: "Payouts: 1st — $450 · 2nd — $350 · 3rd — $125 · Most points — $75." },
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

// NOTE: Polls, trade boards, the vacation vote/thread, and the home-page feed
// are NOT defined here — they're created and edited live on the site and
// stored server-side (Vercel Blob) so everyone sees the same thing.

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
