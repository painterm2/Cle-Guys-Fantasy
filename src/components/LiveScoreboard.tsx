"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import type { Matchup } from "@/lib/espn";
import { Avatar } from "./Avatar";
import { avatarColor } from "@/lib/teams";

interface ScoreboardResponse {
  status: "live" | "unconfigured" | "error";
  data: Matchup[];
  needsCredentials: boolean;
  week?: number;
  error?: string;
}

export function LiveScoreboard({ compact = false }: { compact?: boolean }) {
  const [res, setRes] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/scoreboard");
        const json = (await r.json()) as ScoreboardResponse;
        if (alive) setRes(json);
      } catch {
        if (alive) setRes({ status: "error", data: [], needsCredentials: false, error: "Network error" });
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    // Refresh every 45s so scores stay live on game day.
    const t = setInterval(load, 45_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ fontFamily: fonts.display, fontSize: compact ? 18 : 22, letterSpacing: 0.5 }}>
        LIVE SCOREBOARD
      </span>
      <span
        style={{
          fontFamily: fonts.condensed,
          fontSize: 11.5,
          background: colors.orange,
          color: "#fff",
          padding: "3px 9px",
          borderRadius: 20,
          letterSpacing: 1,
        }}
      >
        <span className="cg-live-dot" />
        {res?.week ? `WEEK ${res.week}` : "LIVE"}
      </span>
    </div>
  );

  let body: React.ReactNode;

  if (loading) {
    body = <Muted>Loading live scores from ESPN…</Muted>;
  } else if (!res || res.status !== "live") {
    body = (
      <Muted>
        {res?.needsCredentials
          ? "Live scores connect once the ESPN link is set up."
          : "No live scores available right now — the scoreboard lights up on game day once the season starts."}
      </Muted>
    );
  } else if (res.data.length === 0) {
    body = <Muted>No matchups scheduled for this week yet.</Muted>;
  } else {
    const rows = compact ? res.data.slice(0, 3) : res.data;
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((m, i) => (
          <MatchupRow key={i} m={m} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 6,
        padding: compact ? "18px 20px" : "22px 26px",
      }}
    >
      {header}
      {body}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13.5, color: colors.brown70, lineHeight: 1.5 }}>{children}</div>;
}

function Side({ side, index, win }: { side: NonNullable<Matchup["away"]> | Matchup["home"]; index: number; win: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
      <Avatar name={side.name} color={avatarColor(index)} logo={side.logo} size={26} />
      <span
        style={{
          fontWeight: win ? 700 : 600,
          fontSize: 14,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: win ? colors.brown : colors.brown90,
        }}
      >
        {side.name}
      </span>
    </div>
  );
}

function MatchupRow({ m, index }: { m: Matchup; index: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "10px 0",
        borderTop: index === 0 ? "none" : "1px solid rgba(49,29,0,0.08)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <Side side={m.home} index={index * 2} win={m.winner === "home"} />
          <ScoreNum value={m.home.score} win={m.winner === "home"} />
        </div>
        {m.away && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <Side side={m.away} index={index * 2 + 1} win={m.winner === "away"} />
            <ScoreNum value={m.away.score} win={m.winner === "away"} />
          </div>
        )}
      </div>
      <div style={{ width: 1 }} />
    </div>
  );
}

function ScoreNum({ value, win }: { value: number; win: boolean }) {
  return (
    <span
      style={{
        fontFamily: fonts.display,
        fontSize: 18,
        color: win ? colors.orange : colors.brown55,
        minWidth: 52,
        textAlign: "right",
      }}
    >
      {value.toFixed(1)}
    </span>
  );
}
