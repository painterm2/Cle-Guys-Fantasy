"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import type { DraftInfo } from "@/lib/espn";

/**
 * Home-page tile for the draft order. Reads the order straight from ESPN so it
 * flips from "TBD" to the real first pick the moment the league sets one.
 */
export function DraftOrderCard() {
  const [info, setInfo] = useState<DraftInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/draft-info");
        const j = (await r.json()) as { status: string; data: DraftInfo };
        if (alive && j.status === "live") setInfo(j.data);
      } catch {
        /* falls through to TBD */
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const order = info?.order ?? [];
  const first = order[0];

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "18px 20px" }}>
      <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.2, color: colors.brown90, fontWeight: 600, marginBottom: 6 }}>
        DRAFT ORDER
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 26, color: colors.brown, lineHeight: 1.1 }}>
        {!loaded ? "…" : order.length ? "SET" : "TBD"}
      </div>
      <div style={{ fontSize: 13, color: colors.brown80, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {!loaded
          ? "checking ESPN"
          : first
            ? `1.01 — ${first.team}`
            : "revealed before draft day"}
      </div>
    </div>
  );
}
