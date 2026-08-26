"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { draftVideos, SEASON_YEAR } from "@/lib/leagueData";
import type { DraftInfo } from "@/lib/espn";

export default function DraftPage() {
  const [order, setOrder] = useState<DraftInfo["order"]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/draft-info");
        const j = (await r.json()) as { status: string; data: DraftInfo };
        if (alive && j.status === "live") setOrder(j.data.order ?? []);
      } catch {
        /* stays on the "not chosen" state */
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageTitle sub="Draft order gets decided by video every year. Recaps live here.">DRAFT ORDER &amp; DRAFT DAY</PageTitle>

      <div style={{ background: colors.brown, borderRadius: 6, padding: "24px 26px", marginBottom: 28, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700 }}>
          {SEASON_YEAR} DRAFT ORDER
        </div>
        {order.length > 0 ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1, alignItems: "flex-start" }}>
            {order.map((d) => (
              <div
                key={d.slot}
                style={{ background: colors.cream, borderRadius: 4, padding: "8px 12px", fontFamily: fonts.condensed, fontWeight: 700, fontSize: 14, color: colors.brown, lineHeight: 1.3, maxWidth: 200 }}
              >
                {d.slot}. {d.team}
                {d.owner ? <span style={{ display: "block", fontWeight: 600, fontSize: 11.5, color: colors.brown60 }}>{d.owner}</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, color: colors.cream, fontSize: 15 }}>
            {loaded
              ? "Not chosen yet — the order gets revealed by video before draft day. Check back once it's set."
              : "Checking ESPN for the draft order…"}
          </div>
        )}
      </div>

      <SectionLabel>DRAFT DAY VIDEOS</SectionLabel>
      <div className="cg-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {draftVideos.map((v) => (
          <div key={v.year} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ aspectRatio: "16/9", background: "#000" }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}${v.start ? `?start=${v.start}` : ""}`}
                title={`${v.year} ${v.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: 0, display: "block" }}
              />
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{v.year} {v.title}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
