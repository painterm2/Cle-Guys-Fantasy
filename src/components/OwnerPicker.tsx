"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { useCommish } from "./CommishProvider";
import { OWNER_CHOICES, teamFor, getMyOwner, setMyOwner } from "@/lib/polls";

/**
 * "Who are you?" selector. Remembers the pick on this device so each manager
 * only chooses once. Voting is keyed off this so one owner = one ballot,
 * even across devices.
 */
export function useMyOwner(): [string, (name: string) => void] {
  const [owner, setOwner] = useState("");

  useEffect(() => {
    setOwner(getMyOwner());
  }, []);

  const choose = (name: string) => {
    setMyOwner(name);
    setOwner(name);
  };

  return [owner, choose];
}

/**
 * Who to credit for an action in the league feed and on posts.
 *
 * `owner` is the manager's real identity — always use it for ballots, since a
 * vote belongs to a person. `actor` is the display name: in commish mode that
 * becomes "The Commish", so admin actions read as the commish rather than as
 * whoever happens to be logged in.
 */
export function useActor() {
  const { commish } = useCommish();
  const [owner, setOwner] = useMyOwner();
  return {
    owner,
    setOwner,
    // Teams are how the league refers to each other, so posts are credited to
    // the team name — except the commish, who posts as the commish.
    actor: commish ? "The Commish" : owner ? teamFor(owner) : "Someone",
    /** false until they've said who they are (commish counts). */
    identified: commish || Boolean(owner),
  };
}

/**
 * Site-wide identity bar. Whatever they pick is remembered on the device and
 * used to credit polls, posts, trade-board edits and parlay legs — and to key
 * their one ballot per poll.
 */
export function OwnerPicker({
  owner,
  onChange,
  note,
}: {
  owner: string;
  onChange: (name: string) => void;
  note?: string;
}) {
  const { commish } = useCommish();

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${owner || commish ? colors.cardBorder : colors.orange}`,
        borderRadius: 6,
        padding: "12px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: owner || commish ? colors.brown90 : colors.orange, flex: "none" }}>
        {owner || commish ? "POSTING AS" : "WHO ARE YOU?"}
      </div>

      {commish && (
        <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: colors.orange, borderRadius: 20, padding: "5px 12px", flex: "none" }}>
          THE COMMISH
        </div>
      )}

      <select
        value={owner}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 14,
          padding: "8px 12px",
          borderRadius: 4,
          border: `1px solid ${colors.cardBorder}`,
          fontFamily: fonts.body,
          background: "#fff",
          color: colors.brown,
          cursor: "pointer",
          minWidth: 210,
        }}
      >
        <option value="">Select your team…</option>
        {OWNER_CHOICES.map((c) => (
          <option key={c.owner} value={c.owner}>
            {c.team} — {c.owner}
          </option>
        ))}
      </select>

      <div style={{ fontSize: 12.5, color: colors.brown70, flex: 1, minWidth: 180 }}>
        {commish
          ? "Commish mode is on, so your posts show as The Commish. Your team is still used for voting."
          : owner
            ? note ?? "Saved on this device — posts and edits get credited to your team."
            : "Pick your team to vote, post, or edit. Everything you do gets credited to it."}
      </div>
    </div>
  );
}
