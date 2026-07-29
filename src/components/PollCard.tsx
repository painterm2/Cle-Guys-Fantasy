"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { logFeed } from "@/lib/sharedStore";
import { COMMISH_PASSWORD } from "@/components/CommishProvider";
import { OWNERS, teamFor, newId, type Poll } from "@/lib/polls";

/**
 * One poll: options, tallies, vote button, and — when the poll allows it —
 * an "add your own option" row.
 *
 * Voting is per-manager: `voter` is who this browser says they are, and the
 * ballot is cast through /api/vote so the browser never sees (or could forge)
 * the owner -> pick mapping. Counts are public; the mapping is commish-only.
 */
export function PollCard({
  poll,
  commish,
  voter,
  actor,
  onMutate,
  onVoted,
}: {
  poll: Poll;
  commish: boolean;
  voter: string;
  actor: string;
  onMutate: (fn: (cur: Poll[]) => Poll[]) => void;
  onVoted: () => void;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");
  const [busy, setBusy] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [ballots, setBallots] = useState<Record<string, string> | null>(null);
  const [showBallots, setShowBallots] = useState(false);

  const counts = poll.counts ?? poll.options.map(() => 0);
  const total = counts.reduce((a, b) => a + b, 0);
  const votedBy = poll.votedBy ?? [];
  const voted = voter ? votedBy.includes(voter) : false;

  const castVote = async () => {
    if (!selection || !voter || voted || busy) return;
    setBusy(true);
    setVoteError(null);
    try {
      const r = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pollId: poll.id, owner: voter, optionId: selection }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Couldn't record your vote.");
      }
      onVoted();
    } catch (err: any) {
      setVoteError(err?.message ?? "Couldn't record your vote.");
    } finally {
      setBusy(false);
    }
  };

  const addOption = () => {
    const label = newOption.trim();
    if (!label) return;
    setNewOption("");
    onMutate((cur) =>
      cur.map((p) =>
        p.id === poll.id && !p.options.some((o) => o.label.toLowerCase() === label.toLowerCase())
          ? { ...p, options: [...p.options, { id: newId(), label }] }
          : p,
      ),
    );
    logFeed(actor, `added “${label}” to the poll “${poll.question}”`);
  };

  const removePoll = () => {
    if (!confirm(`Delete the poll “${poll.question}” for everyone?`)) return;
    onMutate((cur) => cur.filter((p) => p.id !== poll.id));
  };

  const removeOption = (optId: string, label: string) => {
    if (!confirm(`Remove option “${label}” for everyone? Votes for it are discarded.`)) return;
    onMutate((cur) =>
      cur.map((p) => (p.id === poll.id ? { ...p, options: p.options.filter((o) => o.id !== optId) } : p)),
    );
  };

  const loadBallots = async () => {
    if (showBallots) {
      setShowBallots(false);
      return;
    }
    try {
      const r = await fetch(`/api/vote?password=${encodeURIComponent(COMMISH_PASSWORD)}`);
      const j = await r.json();
      setBallots(j.ballots?.[poll.id] ?? {});
      setShowBallots(true);
    } catch {
      setBallots({});
      setShowBallots(true);
    }
  };

  const notVoted = OWNERS.filter((o) => !votedBy.includes(o));

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
        const pct = total === 0 ? 0 : Math.round((counts[oi] / total) * 100);
        const selected = selection === opt.id;
        return (
          <div key={opt.id} style={{ marginBottom: 9 }}>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4, cursor: voted ? "default" : "pointer", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                {!voted && (
                  <input
                    type="radio"
                    name={`poll-${poll.id}`}
                    checked={selected}
                    onChange={() => setSelection(opt.id)}
                    style={{ accentColor: colors.orange }}
                  />
                )}
                <span>{opt.label}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, color: colors.brown80, flex: "none" }}>
                <span>
                  {counts[oi]} {counts[oi] === 1 ? "vote" : "votes"}{total > 0 ? ` · ${pct}%` : ""}
                </span>
                {commish && poll.options.length > 2 && (
                  <span onClick={() => removeOption(opt.id, opt.label)} title="Remove option (commish)" style={{ color: colors.orange, cursor: "pointer", fontWeight: 700 }}>
                    ×
                  </span>
                )}
              </span>
            </label>
            <div style={{ height: 9, borderRadius: 5, background: "#f2ede0", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: colors.orange, borderRadius: 5, transition: "width .3s" }} />
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

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {voted ? (
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 600, color: colors.brown80, letterSpacing: 0.5 }}>
            ✓ Your vote is in · {total} of {OWNERS.length} managers voted
          </div>
        ) : (
          <>
            <button
              onClick={castVote}
              disabled={!selection || !voter || busy}
              style={{
                background: !selection || !voter || busy ? "#e6ddcb" : colors.brown,
                color: !selection || !voter || busy ? colors.brown60 : colors.cream,
                border: "none",
                fontFamily: fonts.condensed,
                fontWeight: 600,
                letterSpacing: 0.5,
                fontSize: 13.5,
                padding: "9px 18px",
                borderRadius: 4,
                cursor: !selection || !voter || busy ? "default" : "pointer",
              }}
            >
              {busy ? "SAVING…" : "CAST VOTE"}
            </button>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12.5, color: colors.brown70, letterSpacing: 0.3 }}>
              {!voter ? "Pick your name above to vote." : `${total} of ${OWNERS.length} managers voted`}
            </div>
          </>
        )}
      </div>
      {voteError && <div style={{ color: colors.orange, fontSize: 13, marginTop: 8, fontFamily: fonts.condensed }}>{voteError}</div>}

      {/* Commish-only: the anonymous curtain comes off */}
      {commish && (
        <div style={{ marginTop: 14, borderTop: "1px dashed rgba(49,29,0,0.15)", paddingTop: 12 }}>
          <button
            onClick={loadBallots}
            style={{ background: "none", border: "none", fontFamily: fonts.condensed, fontSize: 12, fontWeight: 700, letterSpacing: 1, color: colors.orange, cursor: "pointer", padding: 0 }}
          >
            {showBallots ? "▾ HIDE BALLOTS (COMMISH ONLY)" : "▸ SHOW BALLOTS (COMMISH ONLY)"}
          </button>
          {showBallots && (
            <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.7 }}>
              {Object.entries(ballots ?? {}).map(([who, label]) => (
                <div key={who}>
                  <strong>{teamFor(who)}</strong> <span style={{ color: colors.brown70 }}>({who})</span> → {label}
                </div>
              ))}
              {Object.keys(ballots ?? {}).length === 0 && (
                <div style={{ color: colors.brown70 }}>No votes yet.</div>
              )}
              {notVoted.length > 0 && (
                <div style={{ color: colors.brown70, marginTop: 6 }}>
                  Hasn&apos;t voted: {notVoted.map(teamFor).join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
