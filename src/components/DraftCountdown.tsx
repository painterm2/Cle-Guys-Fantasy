"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { DRAFT_CALL_URL } from "@/lib/leagueData";
import type { DraftInfo } from "@/lib/espn";

/** Everything the league needs on draft day: when it starts, and how to join. */
export function DraftCountdown() {
  const [info, setInfo] = useState<DraftInfo | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/draft-info");
        const j = (await r.json()) as { status: string; data: DraftInfo };
        if (alive && j.status === "live") setInfo(j.data);
      } catch {
        /* no countdown, no harm */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Nothing scheduled, or the draft is long finished — stay out of the way.
  if (!info?.date || info.complete) return null;
  const ms = info.date - now;
  const started = ms <= 0;
  // Keep it up for four hours after kickoff, then retire it.
  if (started && ms < -4 * 60 * 60 * 1000) return null;

  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  const when = new Date(info.date).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        background: colors.brown,
        border: `2px solid ${colors.orange}`,
        borderRadius: 6,
        padding: "18px 24px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 2, color: colors.orange, fontWeight: 700, marginBottom: 5 }}>
          {info.inProgress || started ? "🏈 DRAFT IS LIVE" : "🏈 DRAFT DAY"}
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: 23, color: colors.cream, lineHeight: 1.15 }}>
          {info.inProgress || started ? "We're drafting right now" : `Draft starts ${when}`}
        </div>
        {!started && (
          <div style={{ fontFamily: fonts.condensed, fontSize: 15, color: colors.creamMuted, marginTop: 5, letterSpacing: 0.5, fontVariantNumeric: "tabular-nums" }}>
            {d > 0 && `${d}d `}
            {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s to go
          </div>
        )}
      </div>

      <a
        href={DRAFT_CALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: colors.orange,
          color: "#fff",
          fontFamily: fonts.condensed,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 0.8,
          padding: "13px 26px",
          borderRadius: 4,
          flex: "none",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        JOIN THE CALL →
      </a>
    </div>
  );
}
