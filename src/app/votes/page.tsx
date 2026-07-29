"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, EmptyState, SectionLabel } from "@/components/ui";
import { useCommish } from "@/components/CommishProvider";
import { PollCard } from "@/components/PollCard";
import { OwnerPicker, useMyOwner } from "@/components/OwnerPicker";
import { useSharedStore, logFeed } from "@/lib/sharedStore";
import { newId, type Poll } from "@/lib/polls";

export default function VotesPage() {
  const { commish } = useCommish();
  const { data: polls, loaded, shared, error, mutate, refresh } = useSharedStore<Poll[]>("polls", []);
  const [owner, setOwner] = useMyOwner();
  const [showForm, setShowForm] = useState(false);

  const addPoll = (question: string, options: string[], closes: string, allowAdditions: boolean) => {
    const poll: Poll = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question,
      closes: closes || undefined,
      options: options.map((label) => ({ id: newId(), label })),
      createdAt: new Date().toISOString(),
      allowAdditions: allowAdditions || undefined,
    };
    mutate((cur) => [poll, ...cur]);
    logFeed("Someone", `opened a new poll: “${question}”`);
    setShowForm(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <PageTitle sub="One vote per manager. Tallies are public — who voted for what is not.">VOTES &amp; POLLS</PageTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "10px 18px", borderRadius: 4, cursor: "pointer", flex: "none" }}
        >
          {showForm ? "CANCEL" : "+ NEW POLL"}
        </button>
      </div>

      {!shared && loaded && (
        <div style={{ background: "#fff8f0", border: "1px solid rgba(251,79,20,0.3)", borderRadius: 6, padding: "10px 16px", fontSize: 13.5, color: colors.brown, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
          Shared saving isn&apos;t connected yet — for now, votes only save on this device.
        </div>
      )}
      {error && <div style={{ color: colors.orange, fontSize: 13.5, marginBottom: 12, fontFamily: fonts.condensed }}>{error}</div>}

      <OwnerPicker owner={owner} onChange={setOwner} />

      {showForm && <NewPollForm onSubmit={addPoll} />}

      {loaded && polls.length === 0 && !showForm && (
        <EmptyState>No open votes right now. Hit “+ NEW POLL” to start one — punishment votes, rule changes, whatever needs deciding.</EmptyState>
      )}

      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} commish={commish} voter={owner} onMutate={mutate} onVoted={refresh} />
      ))}
    </>
  );
}

function NewPollForm({
  onSubmit,
}: {
  onSubmit: (question: string, options: string[], closes: string, allowAdditions: boolean) => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [closes, setCloses] = useState("");
  const [allowAdditions, setAllowAdditions] = useState(false);

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
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={allowAdditions} onChange={(e) => setAllowAdditions(e.target.checked)} style={{ accentColor: colors.orange }} />
          Let people add their own options
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {options.length < 6 && (
            <button onClick={() => setOptions([...options, ""])} style={{ background: "none", border: `1px dashed ${colors.cardBorder}`, borderRadius: 4, padding: "7px 12px", fontFamily: fonts.condensed, fontSize: 12.5, fontWeight: 600, color: colors.brown80, cursor: "pointer" }}>
              + ADD OPTION
            </button>
          )}
          <input value={closes} onChange={(e) => setCloses(e.target.value)} placeholder="Closes… (optional, e.g. “Closes Friday”)" style={input({ width: 240 })} />
          <button
            onClick={() => valid && onSubmit(question.trim(), clean, closes.trim(), allowAdditions)}
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
