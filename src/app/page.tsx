import Link from "next/link";
import { colors, fonts } from "@/lib/theme";
import { avatarColor, initialsOf } from "@/lib/teams";
import { LiveScoreboard } from "@/components/LiveScoreboard";
import { statCards, feedItems, currentPunishment, SEASON_LABEL } from "@/lib/leagueData";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <div
        style={{
          background: colors.brown,
          borderRadius: 6,
          padding: "38px 42px",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(135deg, rgba(245,239,228,0.03) 0 14px, transparent 14px 28px)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 3, color: colors.orange, fontWeight: 700, marginBottom: 8 }}>
            {SEASON_LABEL}
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 1, color: colors.cream, marginBottom: 12 }}>
            CLEVELAND GUYS
            <br />
            FANTASY FOOTBALL
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: 17, color: colors.creamMuted, maxWidth: 520 }}>
            10 teams. 7 seasons of history. Unfinished business. Home base for rules, records, trades, and whatever
            punishment we land on next.
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="cg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "18px 20px" }}>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.2, color: colors.brown90, fontWeight: 600, marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 26, color: colors.brown }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: colors.brown80, marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Feed + right column */}
      <div className="cg-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px" }}>
          <div style={{ fontFamily: fonts.display, fontSize: 18, letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>LEAGUE PULSE</span>
            <span style={{ fontFamily: fonts.condensed, fontSize: 11.5, background: colors.orange, color: "#fff", padding: "3px 9px", borderRadius: 20, letterSpacing: 1 }}>
              LIVE FEED
            </span>
          </div>
          {feedItems.map((fi, i) => (
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
                {fi.teamIndex != null ? initialsOf(fi.who) : fi.who[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>
                  <strong>{fi.who}</strong> {fi.what}
                </div>
                <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown70, marginTop: 2, letterSpacing: 0.3 }}>
                  {fi.when}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LiveScoreboard compact />

          <div style={{ background: colors.orange, borderRadius: 6, padding: "20px 22px", color: "#fff" }}>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>
              CURRENT PUNISHMENT
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 1.15, marginBottom: 8 }}>{currentPunishment.text}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{currentPunishment.sub}</div>
          </div>

          <CtaCard label="OPEN VOTE" title="What's the 2026 loser's punishment?" href="/votes" cta="CAST YOUR VOTE →" />
          <CtaCard label="2028 DRAFT VACATION" title="Nashville vs. Vegas — location vote is open" href="/vacation" cta="SEE THE PLAN →" />
        </div>
      </div>
    </>
  );
}

function CtaCard({ label, title, href, cta }: { label: string; title: string; href: string; cta: string }) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "20px 22px" }}>
      <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: colors.brown90, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{title}</div>
      <Link
        href={href}
        style={{
          display: "inline-block",
          background: colors.brown,
          color: colors.cream,
          fontFamily: fonts.condensed,
          fontWeight: 600,
          letterSpacing: 0.5,
          fontSize: 13.5,
          padding: "9px 16px",
          borderRadius: 4,
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
