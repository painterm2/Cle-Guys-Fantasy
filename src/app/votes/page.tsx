"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, EmptyState, SectionLabel } from "@/components/ui";
import { useCommish } from "@/components/CommishProvider";
import { useSharedStore, logFeed } from "@/lib/sharedStore";

interface Poll {
  id: string;
  question: string;
  closes?: string;
  options: { label: string; votes: number }[];
  createdAt: string;
}

const votedKey = (id: string) => `cg-voted-${id}`;

export default function VotesPage() {
  const { commish } = useCommish();
  const { data: polls, loaded, shared, error, mutate } = useSharedStore<Poll[]>("polls", []);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  // bump to re-render after localStorage "voted" marks change
  const [, setTick] = useState(0);

  const hasVoted = (id: string) => typeof window !== "undefined" && localStorage.getItem(votedKey(id)) != null;
  const myPick = (id: string) => {
    const v = typeof window !== "undefined" ? localStorage.getItem(votedKey(id)) : null;
    return v == null ? null : Number(v);
  };

  const castVote = (poll: Poll) => {
    const optIdx = selection[poll.id];
    if (optIdx == null || hasVoted(poll.id)) return;
    localStorage.setItem(votedKey(poll.id), String(optIdx));
    setTick((t) => t + 1);
    mutate((cur) =>
      cur.map((p) =>
        p.id === poll.id
          ? { ...p, options: p.options.map((o, j) => (j === optIdx ? { ...o, votes: o.votes + 1 } : o)) }
          : p,
      ),
    );
  };

  const addPoll = (question: string, options: string[], closes: string) => {
    const poll: Poll = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question,
      closes: closes || undefined,
      options: options.map((label) => ({ label, votes: 0 })),
      createdAt: new Date().toISOString(),
    };
    mutate((cur) => [poll, ...cur]);
    logFeed("Someone", `opened a new poll: “${question}”`);
    setShowForm(false);
  };

  const removePoll = (poll: Poll) => {
    if (!confirm(`Delete the poll “${poll.question}” for everyone?`)) return;
    mutate((cur) => cur.filter((p) => p.id !== poll.id));
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <PageTitle sub={shared ? "Votes are shared — everyone sees the same tallies." : undefined}>VOTES &amp; POLLS</PageTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "10px 18px", borderRadius: 4, cursor: "pointer", flex: "none" }}
        >
          {showForm ? "CANCEL" : "+ NEW POLL"}
        </button>
      </div>

      {!shared && loaded && (
        <div style={{ background: "#fff8f0", border: "1px solid rgba(251,79,20,0.3)", borderRadius: 6, padding: "10px 16px", fontSize: 13.5, color: colors.brown, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
          Shared saving isn't connected yet — for now, votes only save on this device.
        </div>
      )}
      {error && <div style={{ color: colors.orange, fontSize: 13.5, marginBottom: 12, fontFamily: fonts.condensed }}>{error}</div>}

      {showForm && <NewPollForm onSubmit={addPoll} />}

      {loaded && polls.length === 0 && !showForm && (
        <EmptyState>No open votes right now. Hit “+ NEW POLL” to start one — punishment votes, rule changes, whatever needs deciding.</EmptyState>
      )}

      {polls.map((poll) => {
        const total = poll.options.reduce((a, o) => a + o.votes, 0);
        const voted = hasVoted(poll.id);
        const pick = myPick(poll.id);
        return (
          <div key={poll.id} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16.5 }}>{poll.question}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "none" }}>
                {poll.closes && (
                  <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown70, letterSpacing: 0.5 }}>{poll.closes}</div>
                )}
                {commish && (
                  <button onClick={() => removePoll(poll)} title="Delete poll (commish)" style={{ background: "none", border: "none", color: colors.orange, cursor: "pointer", fontSize: 15, lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>
            </div>

            {poll.options.map((opt, oi) => {
              const pct = total === 0 ? 0 : Math.round((opt.votes / total) * 100);
              const chosen = pick === oi;
              const selected = selection[poll.id] === oi;
              return (
                <div key={oi} style={{ marginBottom: 9 }}>
                  <label style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4, cursor: voted ? "default" : "pointer", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      {!voted && (
                        <input
                          type="radio"
                          name={`poll-${poll.id}`}
                          checked={selected}
                          onChange={() => setSelection({ ...selection, [poll.id]: oi })}
                          style={{ accentColor: colors.orange }}
                        />
                      )}
                      <span>
                        {opt.label}{" "}
                        {chosen && <span style={{ color: colors.orange, fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 0.5 }}>· YOUR PICK</span>}
                      </span>
                    </span>
                    <span style={{ color: colors.brown80 }}>
                      {opt.votes} {opt.votes === 1 ? "vote" : "votes"}{total > 0 ? ` · ${pct}%` : ""}
                    </span>
                  </label>
                  <div style={{ height: 9, borderRadius: 5, background: "#f2ede0", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: chosen ? colors.brown : colors.orange, borderRadius: 5, transition: "width .3s" }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
              {voted ? (
                <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 600, color: colors.brown80, letterSpacing: 0.5 }}>
                  ✓ Vote counted · {total} total {total === 1 ? "vote" : "votes"}
                </div>
              ) : (
                <button
                  onClick={() => castVote(poll)}
                  disabled={selection[poll.id] == null}
                  style={{
                    background: selection[poll.id] == null ? "#e6ddcb" : colors.brown,
                    color: selection[poll.id] == null ? colors.brown60 : colors.cream,
                    border: "none",
                    fontFamily: fonts.condensed,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    fontSize: 13.5,
                    padding: "9px 18px",
                    borderRadius: 4,
                    cursor: selection[poll.id] == null ? "default" : "pointer",
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

function NewPollForm({ onSubmit }: { onSubmit: (question: string, options: string[], closes: string) => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [closes, setCloses] = useState("");

  const clean = options.map((o) => o.trim()).filter(Boolean);
  const valid = question.trim().length > 0 && clean.length >= 2;

  const input = (extra?: React.CSSProperties): React.CSSProperties => ({
    fontSize: 14,
    padding: "9px 12px",
    borderRadius: 4,
    border: `1px solid ${colors.cardBorder}`,
    outline: "none",
    fontFamily: fonts.body,
    width: "100%",
    ...extra,
  });

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 20 }}>
      <SectionLabel color={colors.orange}>NEW POLL</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question — e.g. What's the 2026 loser's punishment?" style={input()} />
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input value={opt} onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))} placeholder={`Option ${i + 1}`} style={input()} />
            {options.length > 2 && (
              <button onClick={() => setOptions(options.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: colors.orange, cursor: "pointer", fontSize: 16 }}>
                ×
              </button>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {options.length < 6 && (
            <button onClick={() => setOptions([...options, ""])} style={{ background: "none", border: `1px dashed ${colors.cardBorder}`, borderRadius: 4, padding: "7px 12px", fontFamily: fonts.condensed, fontSize: 12.5, fontWeight: 600, color: colors.brown80, cursor: "pointer" }}>
              + ADD OPTION
            </button>
          )}
          <input value={closes} onChange={(e) => setCloses(e.target.value)} placeholder="Closes… (optional, e.g. “Closes Friday”)" style={input({ width: 240 })} />
          <button
            onClick={() => valid && onSubmit(question.trim(), clean, closes.trim())}
            disabled={!valid}
            style={{ background: valid ? colors.orange : "#e6ddcb", color: valid ? "#fff" : colors.brown60, border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "10px 18px", borderRadius: 4, cursor: valid ? "pointer" : "default" }}
          >
            OPEN POLL
          </button>
        </div>
      </div>
    </div>
  );
}
