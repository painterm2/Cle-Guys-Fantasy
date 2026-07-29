"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, EmptyState } from "@/components/ui";
import { activePolls } from "@/lib/leagueData";

// Seed each option's tally from its starting count in leagueData (usually 0
// for a fresh poll). Real vote storage would live server-side.
function seedCounts() {
  return activePolls.map((p) => p.options.map((o) => o.pct));
}

export default function VotesPage() {
  const [counts, setCounts] = useState<number[][]>(seedCounts);
  const [voted, setVoted] = useState<Record<number, number>>({});
  const [selection, setSelection] = useState<Record<number, number>>({});

  useEffect(() => {
    const c = localStorage.getItem("cg-poll-counts-v2");
    const v = localStorage.getItem("cg-poll-voted-v2");
    if (c) try { setCounts(JSON.parse(c)); } catch {}
    if (v) try { setVoted(JSON.parse(v)); } catch {}
  }, []);

  const castVote = (pollIdx: number) => {
    const optIdx = selection[pollIdx];
    if (optIdx == null || voted[pollIdx] != null) return;
    const nextCounts = counts.map((row, i) => (i === pollIdx ? row.map((n, j) => (j === optIdx ? n + 1 : n)) : row));
    const nextVoted = { ...voted, [pollIdx]: optIdx };
    setCounts(nextCounts);
    setVoted(nextVoted);
    localStorage.setItem("cg-poll-counts-v2", JSON.stringify(nextCounts));
    localStorage.setItem("cg-poll-voted-v2", JSON.stringify(nextVoted));
  };

  return (
    <>
      <PageTitle>VOTES &amp; POLLS</PageTitle>

      {activePolls.length === 0 && (
        <EmptyState>
          No open votes right now. Polls get added in <code>activePolls</code> in <code>src/lib/leagueData.ts</code> — punishment votes,
          rule changes, whatever needs deciding.
        </EmptyState>
      )}

      {activePolls.map((poll, pi) => {
        const total = counts[pi].reduce((a, b) => a + b, 0) || 1;
        const hasVoted = voted[pi] != null;
        return (
          <div key={pi} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16.5 }}>{poll.question}</div>
              <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown70, letterSpacing: 0.5, flex: "none" }}>{poll.closes}</div>
            </div>

            {poll.options.map((opt, oi) => {
              const pct = Math.round((counts[pi][oi] / total) * 100);
              const chosen = voted[pi] === oi;
              const selected = selection[pi] === oi;
              return (
                <div key={oi} style={{ marginBottom: 9 }}>
                  <label style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4, cursor: hasVoted ? "default" : "pointer", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      {!hasVoted && (
                        <input
                          type="radio"
                          name={`poll-${pi}`}
                          checked={selected}
                          onChange={() => setSelection({ ...selection, [pi]: oi })}
                          style={{ accentColor: colors.orange }}
                        />
                      )}
                      <span>
                        {opt.label} {chosen && <span style={{ color: colors.orange, fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 0.5 }}>· YOUR PICK</span>}
                      </span>
                    </span>
                    <span style={{ color: colors.brown80 }}>{pct}%</span>
                  </label>
                  <div style={{ height: 9, borderRadius: 5, background: "#f2ede0", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: chosen ? colors.brown : colors.orange, borderRadius: 5, transition: "width .3s" }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
              {hasVoted ? (
                <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 600, color: colors.brown80, letterSpacing: 0.5 }}>
                  ✓ Vote counted · {total} total {total === 1 ? "vote" : "votes"}
                </div>
              ) : (
                <button
                  onClick={() => castVote(pi)}
                  disabled={selection[pi] == null}
                  style={{
                    background: selection[pi] == null ? "#e6ddcb" : colors.brown,
                    color: selection[pi] == null ? colors.brown60 : colors.cream,
                    border: "none",
                    fontFamily: fonts.condensed,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    fontSize: 13.5,
                    padding: "9px 18px",
                    borderRadius: 4,
                    cursor: selection[pi] == null ? "default" : "pointer",
                  }}
                >
                  CAST VOTE
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
