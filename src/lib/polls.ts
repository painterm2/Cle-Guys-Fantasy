// Shared poll types — used by the Votes page and any page that syncs a poll
// (e.g. the 2028 In-Person Draft Location page).

export interface PollOption {
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  closes?: string;
  options: PollOption[];
  createdAt: string;
  /** When true, anyone can append their own option to the poll. */
  allowAdditions?: boolean;
}

/** localStorage key marking that this browser already voted on a poll. */
export const pollVotedKey = (id: string) => `cg-voted-${id}`;
