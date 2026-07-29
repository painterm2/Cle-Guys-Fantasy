import { ownerRealNames } from "./leagueData";

// Shared poll types — used by the Votes page and any page that syncs a poll
// (e.g. the 2028 In-Person Draft Location page).
//
// Voting is by OWNER, not by browser: each manager picks who they are once,
// and a poll holds one ballot per owner (league-wide, whatever device they
// vote from).
//
// ANONYMITY: the owner -> pick mapping (`ballots`) never leaves the server.
// Browsers receive only vote counts and the list of who has voted (not what
// they picked). The commish reveals the mapping through a separate endpoint.

export interface PollOption {
  /** Stable id so ballots survive options being added/removed. */
  id: string;
  label: string;
}

/** A poll as the browser sees it — counts only, no ballot mapping. */
export interface Poll {
  id: string;
  question: string;
  closes?: string;
  options: PollOption[];
  createdAt: string;
  /** "rule" polls are Yay/Nay proposals that pass on a league majority. */
  kind?: "poll" | "rule";
  /** Who proposed it (rule proposals only). */
  proposedBy?: string;
  /** When true, anyone can append their own option to the poll. */
  allowAdditions?: boolean;
  /** Commish closed it — no further votes or changes. */
  closed?: boolean;
  /** votes per option, aligned to `options`. Server-computed. */
  counts?: number[];
  /** owners who have cast a ballot (not what they picked). Server-computed. */
  votedBy?: string[];
  /** owner -> option id. Server-only; present solely in commish reveals. */
  ballots?: Record<string, string>;
}

/** The league's managers, from the team->owner map (deduped, alphabetical). */
export const OWNERS: string[] = [...new Set(Object.values(ownerRealNames))].sort();

/** manager -> their team name (first one listed for them). */
const TEAM_BY_OWNER: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [team, owner] of Object.entries(ownerRealNames)) {
    if (!map[owner]) map[owner] = team;
  }
  return map;
})();

/** The team name to show for a manager — that's how the league knows them. */
export function teamFor(owner: string): string {
  return TEAM_BY_OWNER[owner] ?? owner;
}

/** Managers with their team names, sorted by team name for the picker. */
export const OWNER_CHOICES: { owner: string; team: string }[] = OWNERS.map((owner) => ({
  owner,
  team: teamFor(owner),
})).sort((a, b) => a.team.localeCompare(b.team));

const OWNER_KEY = "cg-owner-name";

// Your own pick, remembered on your device so the card can show what you chose
// and prefill it when you change your vote. The server never tells a browser
// how anyone voted — including you — so this is the only place it lives.
const pickKey = (pollId: string) => `cg-mypick-${pollId}`;

export function getMyPick(pollId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(pickKey(pollId));
}

export function setMyPick(pollId: string, optionId: string) {
  if (typeof window !== "undefined") localStorage.setItem(pickKey(pollId), optionId);
}

export function getMyOwner(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OWNER_KEY) ?? "";
}

export function setMyOwner(name: string) {
  if (name) localStorage.setItem(OWNER_KEY, name);
  else localStorage.removeItem(OWNER_KEY);
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Votes needed for a rule to pass — a straight majority of the league. */
export const MAJORITY = Math.floor(OWNERS.length / 2) + 1;

export const YAY = "yay";
export const NAY = "nay";

/** Build the Yay/Nay poll behind a rule proposal. */
export function makeRuleProposal(text: string, proposedBy: string): Poll {
  return {
    id: newId(),
    question: text,
    kind: "rule",
    proposedBy,
    options: [
      { id: YAY, label: "Yay — adopt it" },
      { id: NAY, label: "Nay — leave it alone" },
    ],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Where a rule proposal stands. It passes the moment a majority of the league
 * says yay, and is dead once enough have said nay that yay can't get there.
 */
export function ruleOutcome(poll: Poll): { status: "pending" | "passed" | "failed"; yay: number; nay: number } {
  const counts = poll.counts ?? poll.options.map(() => 0);
  const yay = counts[poll.options.findIndex((o) => o.id === YAY)] ?? 0;
  const nay = counts[poll.options.findIndex((o) => o.id === NAY)] ?? 0;
  if (yay >= MAJORITY) return { status: "passed", yay, nay };
  if (nay > OWNERS.length - MAJORITY) return { status: "failed", yay, nay };
  return { status: "pending", yay, nay };
}

/** Counts per option index, derived from a ballots map. */
export function countsFrom(options: PollOption[], ballots: Record<string, string> | undefined): number[] {
  const byId = new Map(options.map((o, i) => [o.id, i]));
  const counts = options.map(() => 0);
  for (const optId of Object.values(ballots ?? {})) {
    const i = byId.get(optId);
    if (i != null) counts[i]++;
  }
  return counts;
}
