"use client";

import { useEffect, useMemo, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { TEAMS, avatarColor } from "@/lib/teams";
import { espnLeagueUrl } from "@/lib/links";
import type { Matchup, Schedule, MatchupSide } from "@/lib/espn";

interface MatchupsResponse {
  status: "live" | "unconfigured" | "error";
  data: Schedule;
  needsCredentials: boolean;
  season: number;
  error?: string;
}

// A neutral preview so the page has structure before ESPN data is available:
// pair teams up for a "Week 1" with no scores yet.
function previewSchedule(): Schedule {
  const matchups: Matchup[] = [];
  for (let i = 0; i < TEAMS.length; i += 2) {
    const mk = (idx: number): MatchupSide => ({
      teamId: idx,
      name: TEAMS[idx],
      abbrev: "",
      logo: null,
      score: 0,
      record: "0-0",
    });
    matchups.push({ matchupPeriodId: 1, home: mk(i), away: mk(i + 1), winner: "undecided", status: "upcoming" });
  }
  return { currentWeek: 1, weeks: [1], matchups };
}

export default function MatchupsPage() {
  const [schedule, setSchedule] = useState<Schedule>(previewSchedule);
  const [meta, setMeta] = useState<{ live: boolean; needsCreds: boolean; error?: string }>({ live: false, needsCreds: false });
  const [loaded, setLoaded] = useState(false);
  const [week, setWeek] = useState<number>(1);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/matchups");
        const json = (await r.json()) as MatchupsResponse;
        if (!alive) return;
        if (json.status === "live" && json.data.matchups.length > 0) {
          setSchedule(json.data);
          setWeek((w) => (w === 1 ? json.data.currentWeek || json.data.weeks[0] : w));
          setMeta({ live: true, needsCreds: false });
        } else {
          setMeta({ live: false, needsCreds: json.needsCredentials, error: json.error });
        }
      } catch {
        if (alive) setMeta({ live: false, needsCreds: false, error: "Could not reach the matchups API." });
      } finally {
        if (alive) setLoaded(true);
      }
    };
    load();
    const t = setInterval(load, 45_000); // keep live scores fresh on game day
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const weeks = schedule.weeks.length ? schedule.weeks : [1];
  const activeWeek = weeks.includes(week) ? week : weeks[0];
  const weekMatchups = useMemo(
    () => schedule.matchups.filter((m) => m.matchupPeriodId === activeWeek),
    [schedule, activeWeek],
  );
  const idx = weeks.indexOf(activeWeek);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: 0, fontWeight: 400 }}>MATCHUPS</h1>
          <div style={{ fontSize: 14, color: colors.brown80, marginTop: 4 }}>
            Live scores and the full weekly schedule, straight from ESPN.
          </div>
        </div>
        <a
          href={espnLeagueUrl("scoreboard")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: fonts.condensed, fontWeight: 700, fontSize: 14, letterSpacing: 0.5, border: `2px solid ${colors.brown}`, padding: "9px 16px", borderRadius: 4, color: colors.brown }}
        >
          OPEN IN ESPN ↗
        </a>
      </div>

      <StatusBanner loaded={loaded} live={meta.live} needsCreds={meta.needsCreds} error={meta.error} />

      {/* Week selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <WeekButton disabled={idx <= 0} onClick={() => setWeek(weeks[idx - 1])}>
          ‹ PREV
        </WeekButton>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: fonts.display, fontSize: 22 }}>WEEK {activeWeek}</span>
          {meta.live && activeWeek === schedule.currentWeek && (
            <span style={{ fontFamily: fonts.condensed, fontSize: 11, background: colors.orange, color: "#fff", padding: "3px 8px", borderRadius: 20, letterSpacing: 1 }}>
              <span className="cg-live-dot" />
              CURRENT
            </span>
          )}
        </div>
        <WeekButton disabled={idx >= weeks.length - 1} onClick={() => setWeek(weeks[idx + 1])}>
          NEXT ›
        </WeekButton>

        <select
          value={activeWeek}
          onChange={(e) => setWeek(Number(e.target.value))}
          style={{ marginLeft: "auto", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "8px 12px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, background: "#fff", color: colors.brown, cursor: "pointer" }}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              Week {w}
              {w === schedule.currentWeek ? " (current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Matchup cards */}
      {weekMatchups.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "24px 26px", color: colors.brown70, fontSize: 14 }}>
          No matchups scheduled for week {activeWeek}.
        </div>
      ) : (
        <div className="cg-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
          {weekMatchups.map((m, i) => (
            <MatchupCard key={i} m={m} seed={i} />
          ))}
        </div>
      )}
    </>
  );
}

function WeekButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: fonts.condensed,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 0.5,
        padding: "8px 14px",
        borderRadius: 4,
        border: `1px solid ${colors.cardBorder}`,
        background: "#fff",
        color: disabled ? colors.brown60 : colors.brown,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: Matchup["status"] }) {
  if (status === "in_progress")
    return (
      <span style={{ fontFamily: fonts.condensed, fontSize: 10.5, background: colors.orange, color: "#fff", padding: "3px 8px", borderRadius: 20, letterSpacing: 1 }}>
        <span className="cg-live-dot" />
        LIVE
      </span>
    );
  if (status === "final")
    return (
      <span style={{ fontFamily: fonts.condensed, fontSize: 10.5, background: colors.brown, color: colors.cream, padding: "3px 8px", borderRadius: 20, letterSpacing: 1 }}>
        FINAL
      </span>
    );
  return (
    <span style={{ fontFamily: fonts.condensed, fontSize: 10.5, background: "#efe6d5", color: colors.brown80, padding: "3px 8px", borderRadius: 20, letterSpacing: 1 }}>
      UPCOMING
    </span>
  );
}

function MatchupCard({ m, seed }: { m: Matchup; seed: number }) {
  const showScores = m.status !== "upcoming";
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <StatusPill status={m.status} />
      </div>
      <TeamRow side={m.home} seed={seed * 2} win={m.winner === "home"} dim={m.winner === "away"} showScore={showScores} />
      <div style={{ height: 1, background: "rgba(49,29,0,0.08)", margin: "6px 0" }} />
      {m.away ? (
        <TeamRow side={m.away} seed={seed * 2 + 1} win={m.winner === "away"} dim={m.winner === "home"} showScore={showScores} />
      ) : (
        <div style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.brown60, padding: "8px 0", letterSpacing: 0.5 }}>BYE WEEK</div>
      )}
    </div>
  );
}

function TeamRow({ side, seed, win, dim, showScore }: { side: MatchupSide; seed: number; win: boolean; dim: boolean; showScore: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", opacity: dim ? 0.6 : 1 }}>
      <Avatar name={side.name} color={avatarColor(seed)} logo={side.logo} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: win ? 700 : 600, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {side.name}
        </div>
        {side.record && (
          <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown60, letterSpacing: 0.3 }}>{side.record}</div>
        )}
      </div>
      {showScore && (
        <span style={{ fontFamily: fonts.display, fontSize: 22, color: win ? colors.orange : colors.brown55, minWidth: 56, textAlign: "right" }}>
          {side.score.toFixed(1)}
        </span>
      )}
      {win && showScore && <span style={{ color: colors.orange, fontSize: 12, marginLeft: 4 }}>◀</span>}
    </div>
  );
}

function StatusBanner({ loaded, live, needsCreds, error }: { loaded: boolean; live: boolean; needsCreds: boolean; error?: string }) {
  if (!loaded)
    return <Banner tone="muted">Loading matchups from ESPN…</Banner>;
  if (live) return null;
  if (needsCreds)
    return (
      <Banner tone="warn">
        Showing a preview bracket. Add your <code>ESPN_S2</code> and <code>ESPN_SWID</code> cookies to pull real matchups &amp; live scores
        (see the README).
      </Banner>
    );
  return (
    <Banner tone="muted">
      Showing a preview bracket — live matchups appear here once the season is underway{error ? ` (${error})` : ""}.
    </Banner>
  );
}

function Banner({ tone, children }: { tone: "warn" | "muted"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    warn: { background: "#fff8f0", color: colors.brown, border: "1px solid rgba(251,79,20,0.3)" },
    muted: { background: "#fff", color: colors.brown80, border: `1px solid ${colors.cardBorder}` },
  };
  return (
    <div style={{ ...styles[tone], borderRadius: 6, padding: "10px 16px", fontSize: 13.5, marginBottom: 20, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}
