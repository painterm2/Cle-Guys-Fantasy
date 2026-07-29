"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel, EmptyState } from "@/components/ui";
import { vacationOptions, vacationThread } from "@/lib/leagueData";

export default function VacationPage() {
  const [votes, setVotes] = useState<number[]>(vacationOptions.map((v) => v.votes));
  const [votedIdx, setVotedIdx] = useState<number | null>(null);
  const [thread, setThread] = useState(vacationThread);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const v = localStorage.getItem("cg-vacation-votes-v2");
    const vi = localStorage.getItem("cg-vacation-voted-v2");
    const t = localStorage.getItem("cg-vacation-thread-v2");
    if (v) try { setVotes(JSON.parse(v)); } catch {}
    if (vi != null) setVotedIdx(Number(vi));
    if (t) try { setThread(JSON.parse(t)); } catch {}
  }, []);

  const vote = (i: number) => {
    if (votedIdx != null) return;
    const next = votes.map((n, j) => (j === i ? n + 1 : n));
    setVotes(next);
    setVotedIdx(i);
    localStorage.setItem("cg-vacation-votes-v2", JSON.stringify(next));
    localStorage.setItem("cg-vacation-voted-v2", String(i));
  };

  const post = () => {
    if (!draft.trim()) return;
    const who = name.trim() || "Guest";
    const next = [...thread, { who, msg: draft.trim() }];
    setThread(next);
    setDraft("");
    localStorage.setItem("cg-vacation-thread-v2", JSON.stringify(next));
  };

  return (
    <>
      <PageTitle sub="One draft, one road trip. Let's lock in the details.">DRAFT VACATION</PageTitle>

      {vacationOptions.length === 0 && (
        <EmptyState style={{ marginBottom: 24 }}>
          No destinations proposed yet. Add cities to <code>vacationOptions</code> in <code>src/lib/leagueData.ts</code> to open the
          vote — or pitch one in the thread below.
        </EmptyState>
      )}

      <div className="cg-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {vacationOptions.map((v, i) => (
          <div key={v.city} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: 120, background: "repeating-linear-gradient(45deg,#e8ddc8 0 10px,#ddd0b6 10px 20px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.condensed, color: colors.brown60, fontSize: 13 }}>
              photo placeholder — {v.city}
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: fonts.display, fontSize: 20, marginBottom: 8 }}>{v.city}</div>
              <div style={{ fontSize: 14, color: colors.brown80, marginBottom: 12 }}>{v.pitch}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 700, color: colors.orange }}>
                  {votes[i]} votes {votedIdx === i && "· your pick"}
                </div>
                <button
                  onClick={() => vote(i)}
                  disabled={votedIdx != null}
                  style={{
                    background: votedIdx != null ? "#e6ddcb" : colors.brown,
                    color: votedIdx != null ? colors.brown60 : colors.cream,
                    border: "none",
                    fontFamily: fonts.condensed,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "7px 14px",
                    borderRadius: 4,
                    cursor: votedIdx != null ? "default" : "pointer",
                  }}
                >
                  {votedIdx === i ? "VOTED" : "VOTE"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "20px 26px" }}>
        <SectionLabel>PLANNING THREAD</SectionLabel>
        {thread.map((m, i) => (
          <div key={i} style={{ padding: "9px 0", borderTop: "1px solid rgba(49,29,0,0.07)", fontSize: 14.5 }}>
            <strong>{m.who}:</strong> {m.msg}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ fontSize: 14, padding: "9px 12px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, outline: "none", fontFamily: fonts.body, width: 120 }}
          />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && post()}
            placeholder="Add to the plan…"
            style={{ fontSize: 14, padding: "9px 12px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, outline: "none", fontFamily: fonts.body, flex: 1, minWidth: 160 }}
          />
          <button
            onClick={post}
            style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "9px 18px", borderRadius: 4, cursor: "pointer" }}
          >
            POST
          </button>
        </div>
      </div>
    </>
  );
}
