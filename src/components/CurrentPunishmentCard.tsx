"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { currentPunishment, SEASON_YEAR } from "@/lib/leagueData";
import type { HistoryData } from "@/lib/espn";

/**
 * The punishment being served this season, and who's serving it. The what is
 * set in leagueData; the who comes from ESPN — last place in the previous
 * regular season — so it re-points itself every year without being edited.
 */
export function CurrentPunishmentCard() {
  const [server, setServer] = useState<{ team: string; owner: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/history");
        const j = (await r.json()) as { status: string; data: HistoryData };
        if (!alive || j.status !== "live") return;
        const last = j.data.lastPlace.find((l) => l.year === SEASON_YEAR - 1);
        if (last) setServer({ team: last.team, owner: last.owner });
      } catch {
        /* the punishment still shows without a name attached */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sub =
    currentPunishment.sub ||
    (server
      ? `${server.owner} — last place in ${SEASON_YEAR - 1}`
      : currentPunishment.text
        ? `Served by last place in ${SEASON_YEAR - 1}`
        : "The league votes before Week 1.");

  return (
    <div style={{ background: colors.orange, borderRadius: 6, padding: "20px 22px", color: "#fff" }}>
      <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>
        CURRENT PUNISHMENT
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 1.15, marginBottom: 8 }}>
        {currentPunishment.text || "Not decided yet."}
      </div>
      <div style={{ fontSize: 13, opacity: 0.92 }}>{sub}</div>
      {server && <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, opacity: 0.8, marginTop: 3, letterSpacing: 0.4 }}>{server.team}</div>}
    </div>
  );
}
