"use client";

import { useEffect, useMemo, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { OwnerPicker, useActor } from "@/components/OwnerPicker";
import { useCommish } from "@/components/CommishProvider";
import { ownerRealNames } from "@/lib/leagueData";
import { useSharedStore, logFeed, timeAgo } from "@/lib/sharedStore";
import type { Schedule, Matchup } from "@/lib/espn";

// One leg of the week's group parlay.
interface Leg {
  who: string;
  pick: string;
  at: string;
}
// Store shape: { "3": { legs: [...] } } keyed by week number.
type ParlayData = Record<string, { legs: Leg[] }>;

interface WeekScore {
  team: string;
  score: number;
}

export default function ParlayPage() {
  const { commish } = useCommish();
  const { data: parlay, loaded: storeLoaded, shared, error, mutate } = useSharedStore<ParlayData>("parlay", {});
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [espnLoaded, setEspnLoaded] = useState(false);
  const [week, setWeek] = useState<number | null>(null);
  const { owner, setOwner, actor, identified } = useActor();
  const [pick, setPick] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/matchups");
        const json = await r.json();
        if (!alive) return;
        if (json.status === "live" && json.data?.matchups?.length > 0) {
          setSchedule(json.data as Schedule);
          setWeek(json.data.currentWeek || 1);
        }
      } catch {
        /* banner covers it */
      } finally {
        if (alive) setEspnLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Per-week team scores + whether the week is fully final.
  const weekInfo = useMemo(() => {
    if (!schedule || week == null) return null;
    const ms: Matchup[] = schedule.matchups.filter((m) => m.matchupPeriodId === week);
    if (ms.length === 0) return null;
    const scores: WeekScore[] = [];
    let allFinal = ms.length > 0;
    let anyStarted = false;
    for (const m of ms) {
      if (m.status !== "final") allFinal = false;
      if (m.status !== "upcoming") anyStarted = true;
      scores.push({ team: m.home.name, score: m.home.score });
      if (m.away) scores.push({ team: m.away.name, score: m.away.score });
    }
    if (!anyStarted) return { state: "upcoming" as const, lowest: null, allFinal: false };
    const lowest = scores.reduce((lo, s) => (s.score < lo.score ? s : lo));
    return { state: allFinal ? ("final" as const) : ("in_progress" as const), lowest, allFinal };
  }, [schedule, week]);

  const weeks = schedule?.weeks ?? [];
  const wk = week ?? 1;
  const legs = parlay[String(wk)]?.legs ?? [];

  const addLeg = () => {
    if (!pick.trim() || !identified) return;
    const leg: Leg = { who: actor, pick: pick.trim(), at: new Date().toISOString() };
    setPick("");
    mutate((cur) => ({ ...cur, [String(wk)]: { legs: [...(cur[String(wk)]?.legs ?? []), leg] } }));
    logFeed(actor, `added a leg to the Week ${wk} parlay: “${leg.pick}”`);
  };

  const removeLeg = (idx: number) => {
    if (!confirm("Delete this leg for everyone?")) return;
    mutate((cur) => ({ ...cur, [String(wk)]: { legs: (cur[String(wk)]?.legs ?? []).filter((_, i) => i !== idx) } }));
  };

  const payerName = weekInfo?.lowest ? ownerRealNames[weekInfo.lowest.team] ?? null : null;

  return (
    <>
      <PageTitle sub="Lowest points each week buys the group parlay ($5–$10). Everyone else drops a leg here — no more digging through the group chat.">
        WEEKLY PARLAY
      </PageTitle>

      {/* Week picker */}
      {weeks.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setWeek(w)}
              style={{
                background: w === wk ? colors.orange : colors.white,
                color: w === wk ? "#fff" : colors.brown80,
                border: `1px solid ${w === wk ? colors.orange : colors.cardBorder}`,
                fontFamily: fonts.condensed,
                fontWeight: 700,
                fontSize: 13,
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              WK {w}
            </button>
          ))}
        </div>
      )}

      {/* This week's payer */}
      <div style={{ background: colors.brown, borderRadius: 6, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ fontSize: 40 }}>💸</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 2, color: colors.orange, fontWeight: 700, marginBottom: 6 }}>
            WEEK {wk} — {weekInfo?.state === "final" ? "BUYS THE PARLAY" : weekInfo?.state === "in_progress" ? "LOWEST SO FAR (NOT FINAL)" : "LOW SCORER"}
          </div>
          {!espnLoaded ? (
            <div style={{ fontFamily: fonts.display, fontSize: 22, color: colors.cream }}>Checking ESPN scores…</div>
          ) : weekInfo?.lowest ? (
            <>
              <div style={{ fontFamily: fonts.display, fontSize: 24, color: colors.cream }}>
                {weekInfo.lowest.team}
                {payerName ? ` — ${payerName}` : ""}
              </div>
              <div style={{ fontSize: 14, color: colors.creamMuted, marginTop: 4 }}>
                {weekInfo.lowest.score.toFixed(1)} points{weekInfo.state === "final" ? " — pays for this week's parlay. Winnings split among everyone else." : " — scores still counting."}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: fonts.display, fontSize: 22, color: colors.cream }}>
              {weekInfo?.state === "upcoming" ? "Week hasn't started yet." : "Scores load from ESPN once the season is underway."}
            </div>
          )}
        </div>
      </div>

      {/* Legs board */}
      <SectionLabel>WEEK {wk} PARLAY LEGS</SectionLabel>

      <OwnerPicker owner={owner} onChange={setOwner} note="Saved on this device — your legs get credited to your team." />

      {!shared && storeLoaded && (
        <Banner tone="warn">Shared saving isn't connected yet — for now, legs only save on this device.</Banner>
      )}
      {error && <div style={{ color: colors.orange, fontSize: 13.5, marginBottom: 12, fontFamily: fonts.condensed }}>{error}</div>}

      <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "20px 26px", marginBottom: 20 }}>
        {storeLoaded && legs.length === 0 && (
          <div style={{ fontSize: 14, color: colors.brown60, padding: "4px 0 10px" }}>
            No legs yet for Week {wk} — drop yours below.
          </div>
        )}
        {legs.map((leg, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: "1px solid rgba(49,29,0,0.07)", alignItems: "baseline" }}>
            <div style={{ fontFamily: fonts.condensed, fontWeight: 700, fontSize: 13.5, color: colors.orange, flex: "none", width: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {leg.who}
            </div>
            <div style={{ flex: 1, fontSize: 14.5 }}>{leg.pick}</div>
            <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown60, flex: "none" }}>{timeAgo(leg.at)}</div>
            {commish && (
              <button onClick={() => removeLeg(i)} title="Delete (commish)" style={{ background: "none", border: "none", color: colors.orange, cursor: "pointer", fontSize: 14, lineHeight: 1, flex: "none" }}>
                ×
              </button>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <input
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLeg()}
            placeholder={identified ? "Your leg — e.g. “Chiefs -3.5” or “Chase anytime TD”" : "Pick your team above to add a leg"}
            style={{ fontSize: 14, padding: "9px 12px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, outline: "none", fontFamily: fonts.body, flex: 1, minWidth: 200 }}
          />
          <button
            onClick={addLeg}
            style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "9px 18px", borderRadius: 4, cursor: "pointer" }}
          >
            ADD LEG
          </button>
        </div>
      </div>

      <div style={{ fontSize: 13, color: colors.brown70, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
        House rule 2.2 — one leg each. Any winnings split between everyone except the week&apos;s lowest scorer.
      </div>
    </>
  );
}

function Banner({ tone, children }: { tone: "warn" | "muted"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    warn: { background: "#fff8f0", color: colors.brown, border: "1px solid rgba(251,79,20,0.3)" },
    muted: { background: colors.white, color: colors.brown80, border: `1px solid ${colors.cardBorder}` },
  };
  return (
    <div style={{ ...styles[tone], borderRadius: 6, padding: "10px 16px", fontSize: 13.5, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}
