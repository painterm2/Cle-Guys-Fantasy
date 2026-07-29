"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";

interface ProofItem {
  url: string;
  pathname: string;
  week: number;
  uploadedAt: string;
}

/**
 * Home-page strip of the latest punishment proof photos. Renders nothing at
 * all until the first photo is posted, so the page stays clean until the
 * punishment actually starts.
 */
export function PunishmentProofStrip({ max = 4 }: { max?: number }) {
  const [items, setItems] = useState<ProofItem[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/punishment-proof");
        const j = await r.json();
        if (alive) setItems(j.items ?? []);
      } catch {
        /* nothing to show */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null; // stays hidden until the first upload

  const latestWeek = items[0]?.week;
  const shown = items.slice(0, max);

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: colors.orange }}>
          📸 PROOF OF PUNISHMENT
        </div>
        {latestWeek ? (
          <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown70, letterSpacing: 0.5 }}>WEEK {latestWeek}</div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(shown.length, 2)}, 1fr)`, gap: 8 }}>
        {shown.map((it) => (
          <a key={it.pathname} href={it.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", aspectRatio: "1/1", borderRadius: 5, overflow: "hidden", border: `1px solid ${colors.cardBorder}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt={`Week ${it.week} proof`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </a>
        ))}
      </div>

      <Link
        href="/punishments"
        style={{ display: "inline-block", marginTop: 12, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: colors.orange }}
      >
        SEE THE WHOLE WALL →
      </Link>
    </div>
  );
}
