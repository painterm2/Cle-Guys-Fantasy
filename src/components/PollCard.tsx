"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { logFeed } from "@/lib/sharedStore";
import { pollVotedKey, type Poll } from "@/lib/polls";

/**
 * One poll: options, tallies, vote button, and — when the poll allows it —
 * an "add your own option" row. Used on Votes and anywhere a poll is synced
 * (e.g. the 2028 In-Person Draft Location page). All writes go through
 * `onMutate`, which updates the shared "polls" store.
 */
export function PollCard({
  poll,
  commish,
  onMutate,
}: {
  poll: Poll;
  commish: boolean;
  onMutate: (fn: (cur: Poll[]) => Poll[]) => void;
}) {
  const [selection, setSelection] = useState<number | null>(null);
  const [newOption, setNewOption] = useState("");
  const [, setTick] = useState(0);

  const voted = typeof window !== "undefined" && localStorage.getItem(pollVotedKey(poll.id)) != null;
  const pickRaw = typeof window !== "undefined" ? localStorage.getItem(pollVotedKey(poll.id)) : null;
  const pick = pickRaw == null ? null : Number(pickRaw);
  const total = poll.options.reduce((a, o) => a + o.votes, 0);

  const castVote = () => {
    if (selection == null || voted) return;
    localStorage.setItem(pollVotedKey(poll.id), String(selection));
    setTick((t) => t + 1);
    const optIdx = selection;
    onMutate((cur) =>
      cur.map((p) =>
        p.id === poll.id
          ? { ...p, options: p.options.map((o, j) => (j === optIdx ? { ...o, votes: o.votes + 1 } : o)) }
          : p,
      ),
    );
  };

  const addOption = () => {
    const label = newOption.trim();
    if (!label) return;
    setNewOption("");
    onMutate((cur) =>
      cur.map((p) =>
        p.id === poll.id && !p.options.some((o) => o.label.toLowerCase() === label.toLowerCase())
          ? { ...p, options: [...p.options, { label, votes: 0 }] }
          : p,
      ),
    );
    logFeed("Someone", `added “${label}” to the poll “${poll.question}”`);
  };

  const removePoll = () => {
    if (!confirm(`Delete the poll “${poll.question}” for everyone?`)) return;
    onMutate((cur) => cur.filter((p) => p.id !== poll.id));
  };

  const removeOption = (idx: number) => {
    if (!confirm(`Remove option “${poll.options[idx].label}” for everyone?`)) return;
    onMutate((cur) => cur.map((p) => (p.id === poll.id ? { ...p, options: p.options.filter((_, j) => j !== idx) } : p)));
  };

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16.5 }}>
          {poll.question}
          {poll.allowAdditions && (
            <span style={{ marginLeft: 10, fontFamily: fonts.condensed, fontSize: 11, letterSpacing: 1, fontWeight: 700, color: colors.orange, border: `1px solid ${colors.orange}`, borderRadius: 20, padding: "2px 8px", verticalAlign: "middle" }}>
              OPEN OPTIONS
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "none" }}>
          {poll.closes && (
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown70, letterSpacing: 0.5 }}>{poll.closes}</div>
          )}
          {commish && (
            <button onClick={removePoll} title="Delete poll (commish)" style={{ background: "none", border: "none", color: colors.orange, cursor: "pointer", fontSize: 15, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {poll.options.map((opt, oi) => {
        const pct = total === 0 ? 0 : Math.round((opt.votes / total) * 100);
        const chosen = pick === oi;
        const selected = selection === oi;
        return (
          <div key={oi} style={{ marginBottom: 9 }}>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4, cursor: voted ? "default" : "pointer", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                {!voted && (
                  <input
                    type="radio"
                    name={`poll-${poll.id}`}
                    checked={selected}
                    onChange={() => setSelection(oi)}
                    style={{ accentColor: colors.orange }}
                  />
                )}
                <span>
                  {opt.label}{" "}
                  {chosen && <span style={{ color: colors.orange, fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 0.5 }}>· YOUR PICK</span>}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, color: colors.brown80, flex: "none" }}>
                <span>
                  {opt.votes} {opt.votes === 1 ? "vote" : "votes"}{total > 0 ? ` · ${pct}%` : ""}
                </span>
                {commish && poll.options.length > 2 && (
                  <span onClick={() => removeOption(oi)} title="Remove option (commish)" style={{ color: colors.orange, cursor: "pointer", fontWeight: 700 }}>
                    ×
                  </span>
                )}
              </span>
            </label>
            <div style={{ height: 9, borderRadius: 5, background: "#f2ede0", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: chosen ? colors.brown : colors.orange, borderRadius: 5, transition: "width .3s" }} />
            </div>
          </div>
        );
      })}

      {poll.allowAdditions && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOption()}
            placeholder="Add your own option…"
            style={{ fontSize: 13.5, padding: "8px 12px", borderRadius: 4, border: `1px dashed rgba(49,29,0,0.3)`, outline: "none", fontFamily: fonts.body, flex: 1, minWidth: 180 }}
          />
          <button
            onClick={addOption}
            style={{ background: "none", border: `1px solid ${colors.orange}`, color: colors.orange, fontFamily: fonts.condensed, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.5, padding: "8px 14px", borderRadius: 4, cursor: "pointer" }}
          >
            + ADD OPTION
          </button>
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
        {voted ? (
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 600, color: colors.brown80, letterSpacing: 0.5 }}>
            ✓ Vote counted · {total} total {total === 1 ? "vote" : "votes"}
          </div>
        ) : (
          <button
            onClick={castVote}
            disabled={selection == null}
            style={{
              background: selection == null ? "#e6ddcb" : colors.brown,
              color: selection == null ? colors.brown60 : colors.cream,
              border: "none",
              fontFamily: fonts.condensed,
              fontWeight: 600,
              letterSpacing: 0.5,
              fontSize: 13.5,
              padding: "9px 18px",
              borderRadius: 4,
              cursor: selection == null ? "default" : "pointer",
            }}
          >
            CAST VOTE
          </button>
        )}
      </div>
    </div>
  );
}
