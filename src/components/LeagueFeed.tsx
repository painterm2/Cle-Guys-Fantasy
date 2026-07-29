"use client";

import { colors, fonts } from "@/lib/theme";
import { avatarColor, initialsOf, TEAMS } from "@/lib/teams";
import { useSharedStore, timeAgo, type FeedItem } from "@/lib/sharedStore";

// Home-page activity feed, fed automatically by actions around the site
// (new polls, trade-board updates, vacation posts…). Shared across the league.
export function LeagueFeed() {
  const { data: items, loaded } = useSharedStore<FeedItem[]>("feed", []);

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px" }}>
      <div style={{ fontFamily: fonts.display, fontSize: 18, letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>LEAGUE PULSE</span>
        <span style={{ fontFamily: fonts.condensed, fontSize: 11.5, background: colors.orange, color: "#fff", padding: "3px 9px", borderRadius: 20, letterSpacing: 1 }}>
          LIVE FEED
        </span>
      </div>

      {loaded && items.length === 0 && (
        <div style={{ border: "2px dashed rgba(49,29,0,0.2)", borderRadius: 6, padding: "24px 20px", textAlign: "center", fontSize: 14, color: colors.brown80 }}>
          Nothing posted yet — polls, trade-board updates, and vacation posts show up here automatically.
        </div>
      )}

      {items.map((fi, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: "1px solid rgba(49,29,0,0.08)" }}>
          <div
            style={{
              width: 34,
              height: 34,
              flex: "none",
              borderRadius: "50%",
              background: fi.teamIndex != null ? avatarColor(fi.teamIndex) : colors.brown,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.condensed,
              fontWeight: 700,
              color: "#fff",
              fontSize: 13,
            }}
          >
            {initialsOf(fi.teamIndex != null ? TEAMS[fi.teamIndex] ?? fi.who : fi.who)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>
              <strong>{fi.who}</strong> {fi.what}
            </div>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown70, marginTop: 2, letterSpacing: 0.3 }}>
              {timeAgo(fi.at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
