import { createHash } from "crypto";
import { list, put } from "@vercel/blob";
import { blobToken } from "./blob";
import { OWNERS, countsFrom, type Poll } from "./polls";

// ---------------------------------------------------------------------------
// Server-side poll storage. Ballots are stored as
//     sha256(salt + owner) -> optionId
// so the stored document never contains a readable "who voted for what" map.
// The blob lives at a public URL, so this matters: even if someone fetches the
// raw JSON, they see opaque hashes. Only the server (which holds the salt) can
// map a hash back to a manager, and it only does so for a commish reveal.
// ---------------------------------------------------------------------------

const POLLS_PATH = "store/polls.json";

/** Server-only secret. The blob token is always present server-side and never
 *  shipped to the browser, so it doubles as the salt unless one is set. */
function salt(): string {
  return process.env.POLL_BALLOT_SALT?.trim() || blobToken() || "cle-guys-fallback-salt";
}

export function hashOwner(owner: string): string {
  return createHash("sha256").update(`${salt()}::${owner}`).digest("hex").slice(0, 24);
}

/** hash -> owner, for the commish reveal (only 10 managers to check). */
function ownerByHash(): Map<string, string> {
  return new Map(OWNERS.map((o) => [hashOwner(o), o]));
}

export async function readPolls(): Promise<Poll[]> {
  const token = blobToken();
  if (!token) return [];
  const { blobs } = await list({ prefix: POLLS_PATH, limit: 1, token });
  if (blobs.length === 0) return [];
  const res = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as Poll[]) : [];
}

export async function writePolls(polls: Poll[]): Promise<void> {
  await put(POLLS_PATH, JSON.stringify(polls), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
    token: blobToken(),
  });
}

/** Strip the ballot mapping; expose only counts and who has voted. */
export function sanitize(polls: Poll[]): Poll[] {
  const byHash = ownerByHash();
  return polls.map((p) => {
    const ballots = p.ballots ?? {};
    const votedBy: string[] = [];
    for (const h of Object.keys(ballots)) {
      const owner = byHash.get(h);
      if (owner) votedBy.push(owner);
    }
    const { ballots: _drop, ...rest } = p;
    return { ...rest, counts: countsFrom(p.options, ballots), votedBy: votedBy.sort() };
  });
}

/** Commish view: hashes resolved back to manager names. */
export function reveal(polls: Poll[]): Record<string, Record<string, string>> {
  const byHash = ownerByHash();
  const out: Record<string, Record<string, string>> = {};
  for (const p of polls) {
    const labelById = new Map(p.options.map((o) => [o.id, o.label]));
    const row: Record<string, string> = {};
    for (const [h, optId] of Object.entries(p.ballots ?? {})) {
      const owner = byHash.get(h);
      if (owner) row[owner] = labelById.get(optId) ?? "(removed option)";
    }
    out[p.id] = row;
  }
  return out;
}

/**
 * Apply a client-submitted poll list (which carries no ballots) on top of the
 * stored one, preserving each poll's ballots. Ballots pointing at options that
 * were removed are dropped, so those managers can vote again.
 */
export function mergeBallots(incoming: Poll[], stored: Poll[]): Poll[] {
  const storedById = new Map(stored.map((p) => [p.id, p]));
  return incoming.map((p) => {
    const prior = storedById.get(p.id);
    const validIds = new Set(p.options.map((o) => o.id));
    const ballots: Record<string, string> = {};
    for (const [h, optId] of Object.entries(prior?.ballots ?? {})) {
      if (validIds.has(optId)) ballots[h] = optId;
    }
    // Never trust counts/votedBy from the client — they're derived on read.
    const { counts: _c, votedBy: _v, ballots: _b, ...rest } = p;
    return { ...rest, ballots };
  });
}

/** Cast one ballot. Returns false if that manager already voted. */
export async function castBallot(pollId: string, owner: string, optionId: string): Promise<boolean> {
  const polls = await readPolls();
  const poll = polls.find((p) => p.id === pollId);
  if (!poll) throw new Error("Poll not found.");
  if (!poll.options.some((o) => o.id === optionId)) throw new Error("Option not found.");

  const h = hashOwner(owner);
  const ballots = poll.ballots ?? {};
  if (ballots[h] != null) return false; // one vote per manager, any device

  poll.ballots = { ...ballots, [h]: optionId };
  await writePolls(polls);
  return true;
}
