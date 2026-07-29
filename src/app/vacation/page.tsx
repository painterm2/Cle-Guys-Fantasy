"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel, EmptyState } from "@/components/ui";
import { useCommish } from "@/components/CommishProvider";
import { PollCard } from "@/components/PollCard";
import { OwnerPicker, useActor } from "@/components/OwnerPicker";
import { useSharedStore, logFeed } from "@/lib/sharedStore";
import type { Poll } from "@/lib/polls";

interface VacationData {
  options: { city: string; pitch: string; votes: number }[];
  thread: { who: string; msg: string; at?: string }[];
  /** Poll id synced onto this page by the commish (the location vote). */
  linkedPollId?: string | null;
}

const EMPTY: VacationData = { options: [], thread: [] };
const VOTED_KEY = "cg-vacation-voted-v3";

export default function VacationPage() {
  const { commish } = useCommish();
  const { data, loaded, shared, error, mutate } = useSharedStore<VacationData>("vacation", EMPTY);
  const { data: polls, mutate: mutatePolls, refresh: refreshPolls } = useSharedStore<Poll[]>("polls", []);
  const { owner, setOwner, actor, identified } = useActor();
  const [draft, setDraft] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [syncPick, setSyncPick] = useState("");
  const [, setTick] = useState(0);

  const linkedPoll = data.linkedPollId ? polls.find((p) => p.id === data.linkedPollId) ?? null : null;

  const syncPoll = () => {
    if (!syncPick) return;
    mutate((cur) => ({ ...cur, linkedPollId: syncPick }));
  };
  const unsyncPoll = () => mutate((cur) => ({ ...cur, linkedPollId: null }));

  const votedCity = typeof window !== "undefined" ? localStorage.getItem(VOTED_KEY) : null;

  const vote = (city: string) => {
    if (votedCity != null) return;
    localStorage.setItem(VOTED_KEY, city);
    setTick((t) => t + 1);
    mutate((cur) => ({
      ...cur,
      options: cur.options.map((o) => (o.city === city ? { ...o, votes: o.votes + 1 } : o)),
    }));
  };

  const addCity = (city: string, pitch: string) => {
    mutate((cur) =>
      cur.options.some((o) => o.city.toLowerCase() === city.toLowerCase())
        ? cur
        : { ...cur, options: [...cur.options, { city, pitch, votes: 0 }] },
    );
    logFeed(actor, `pitched ${city} for the 2028 draft location.`);
    setShowForm(false);
  };

  const removeCity = (city: string) => {
    if (!confirm(`Remove ${city} from the vote for everyone?`)) return;
    mutate((cur) => ({ ...cur, options: cur.options.filter((o) => o.city !== city) }));
  };

  const post = () => {
    if (!draft.trim() || !identified) return;
    const who = actor;
    const msg = draft.trim();
    setDraft("");
    mutate((cur) => ({ ...cur, thread: [...cur.thread, { who, msg, at: new Date().toISOString() }] }));
    logFeed(actor, "posted in the draft location thread.");
  };

  const removePost = (idx: number) => {
    if (!confirm("Delete this message for everyone?")) return;
    mutate((cur) => ({ ...cur, thread: cur.thread.filter((_, i) => i !== idx) }));
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <PageTitle sub="One draft, one road trip. Let's lock in the details.">2028 IN-PERSON DRAFT LOCATION</PageTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "10px 18px", borderRadius: 4, cursor: "pointer", flex: "none" }}
        >
          {showForm ? "CANCEL" : "+ PITCH A CITY"}
        </button>
      </div>

      {!shared && loaded && (
        <div style={{ background: "#fff8f0", border: "1px solid rgba(251,79,20,0.3)", borderRadius: 6, padding: "10px 16px", fontSize: 13.5, color: colors.brown, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
          Shared saving isn't connected yet — for now, edits only save on this device.
        </div>
      )}
      {error && <div style={{ color: colors.orange, fontSize: 13.5, marginBottom: 12, fontFamily: fonts.condensed }}>{error}</div>}

      <OwnerPicker owner={owner} onChange={setOwner} />

      {/* Commish: sync a poll from Votes & Polls onto this page as the location vote */}
      {commish && (
        <div style={{ background: colors.white, border: `1px dashed ${colors.orange}`, borderRadius: 6, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: colors.orange, flex: "none" }}>
            COMMISH — SYNC A POLL
          </div>
          {linkedPoll ? (
            <>
              <div style={{ fontSize: 13.5, flex: 1, minWidth: 160 }}>
                Synced: <strong>{linkedPoll.question}</strong>
              </div>
              <button onClick={unsyncPoll} style={{ background: "none", border: `1px solid ${colors.cardBorder}`, color: colors.brown80, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 12.5, padding: "7px 12px", borderRadius: 4, cursor: "pointer" }}>
                UNSYNC
              </button>
            </>
          ) : (
            <>
              <select
                value={syncPick}
                onChange={(e) => setSyncPick(e.target.value)}
                style={{ fontSize: 13.5, padding: "8px 10px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, fontFamily: fonts.body, flex: 1, minWidth: 180, background: "#fff", color: colors.brown }}
              >
                <option value="">Pick a poll from Votes &amp; Polls…</option>
                {polls.map((p) => (
                  <option key={p.id} value={p.id}>{p.question}</option>
                ))}
              </select>
              <button
                onClick={syncPoll}
                disabled={!syncPick}
                style={{ background: syncPick ? colors.orange : "#e6ddcb", color: syncPick ? "#fff" : colors.brown60, border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 12.5, letterSpacing: 0.5, padding: "8px 14px", borderRadius: 4, cursor: syncPick ? "pointer" : "default" }}
              >
                SYNC HERE
              </button>
            </>
          )}
        </div>
      )}

      {/* The synced location vote */}
      {linkedPoll && (
        <>
          <SectionLabel>LOCATION VOTE</SectionLabel>
          <PollCard poll={linkedPoll} commish={commish} voter={owner} actor={actor} onMutate={mutatePolls} onVoted={refreshPolls} />
        </>
      )}

      {showForm && <NewCityForm onSubmit={addCity} />}

      {loaded && !linkedPoll && data.options.length === 0 && !showForm && (
        <EmptyState style={{ marginBottom: 24 }}>
          No destinations proposed yet. Hit “+ PITCH A CITY” to open the vote — or make your case in the thread below.
        </EmptyState>
      )}

      <div className="cg-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {data.options.map((v) => (
          <div key={v.city} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: 120, background: "repeating-linear-gradient(45deg,#e8ddc8 0 10px,#ddd0b6 10px 20px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.condensed, color: colors.brown60, fontSize: 13, position: "relative" }}>
              photo placeholder — {v.city}
              {commish && (
                <button onClick={() => removeCity(v.city)} title="Remove (commish)" style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(49,29,0,0.75)", color: "#fff", fontSize: 14, lineHeight: 1, cursor: "pointer" }}>
                  ×
                </button>
              )}
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: fonts.display, fontSize: 20, marginBottom: 8 }}>{v.city}</div>
              <div style={{ fontSize: 14, color: colors.brown80, marginBottom: 12 }}>{v.pitch}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: fonts.condensed, fontSize: 13, fontWeight: 700, color: colors.orange }}>
                  {v.votes} {v.votes === 1 ? "vote" : "votes"} {votedCity === v.city && "· your pick"}
                </div>
                <button
                  onClick={() => vote(v.city)}
                  disabled={votedCity != null}
                  style={{
                    background: votedCity != null ? "#e6ddcb" : colors.brown,
                    color: votedCity != null ? colors.brown60 : colors.cream,
                    border: "none",
                    fontFamily: fonts.condensed,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "7px 14px",
                    borderRadius: 4,
                    cursor: votedCity != null ? "default" : "pointer",
                  }}
                >
                  {votedCity === v.city ? "VOTED" : "VOTE"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "20px 26px" }}>
        <SectionLabel>PLANNING THREAD</SectionLabel>
        {loaded && data.thread.length === 0 && (
          <div style={{ fontSize: 14, color: colors.brown60, padding: "6px 0 2px" }}>Nothing yet — start the planning below.</div>
        )}
        {data.thread.map((m, i) => (
          <div key={i} style={{ padding: "9px 0", borderTop: "1px solid rgba(49,29,0,0.07)", fontSize: 14.5, display: "flex", gap: 8, alignItems: "baseline" }}>
            <div style={{ flex: 1 }}>
              <strong>{m.who}:</strong> {m.msg}
            </div>
            {commish && (
              <button onClick={() => removePost(i)} title="Delete (commish)" style={{ background: "none", border: "none", color: colors.orange, cursor: "pointer", fontSize: 14, lineHeight: 1, flex: "none" }}>
                ×
              </button>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && post()}
            placeholder={identified ? "Add to the plan…" : "Pick your team above to post"}
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

function NewCityForm({ onSubmit }: { onSubmit: (city: string, pitch: string) => void }) {
  const [city, setCity] = useState("");
  const [pitch, setPitch] = useState("");
  const valid = city.trim().length > 0;
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 20 }}>
      <SectionLabel color={colors.orange}>PITCH A DESTINATION</SectionLabel>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ fontSize: 14, padding: "9px 12px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, outline: "none", fontFamily: fonts.body, width: 180 }} />
        <input value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Why there? Make the case…" style={{ fontSize: 14, padding: "9px 12px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, outline: "none", fontFamily: fonts.body, flex: 1, minWidth: 200 }} />
        <button
          onClick={() => valid && onSubmit(city.trim(), pitch.trim())}
          disabled={!valid}
          style={{ background: valid ? colors.orange : "#e6ddcb", color: valid ? "#fff" : colors.brown60, border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "10px 18px", borderRadius: 4, cursor: valid ? "pointer" : "default" }}
        >
          ADD TO THE VOTE
        </button>
      </div>
    </div>
  );
}
