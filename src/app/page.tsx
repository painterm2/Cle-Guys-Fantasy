import Link from "next/link";
import { colors, fonts } from "@/lib/theme";
import { LiveScoreboard } from "@/components/LiveScoreboard";
import { DraftOrderStat } from "@/components/DraftOrderStat";
import { LeagueFeed } from "@/components/LeagueFeed";
import { PunishmentProofStrip } from "@/components/PunishmentProofStrip";
import { StatCard } from "@/components/ui";
import { statCards, currentPunishment, SEASON_LABEL } from "@/lib/leagueData";

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
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 3, color: colors.orange, fontWeight: 700, marginBottom: 10 }}>
            {SEASON_LABEL}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Cleveland Guys" style={{ width: "min(400px, 90%)", display: "block", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: fonts.body, fontSize: 17, color: colors.creamMuted, maxWidth: 520, margin: "0 auto" }}>
            10 teams. 7 seasons of history. Unfinished business. Home base for rules, records, trades, and whatever
            punishment we land on next.
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="cg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {statCards.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} />
        ))}
        {/* The draft-order tile fills itself in from ESPN. */}
        <DraftOrderStat />
      </div>

      {/* Feed + right column */}
      <div className="cg-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <LeagueFeed />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LiveScoreboard compact />

          <PunishmentProofStrip />

          <div style={{ background: colors.orange, borderRadius: 6, padding: "20px 22px", color: "#fff" }}>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>
              CURRENT PUNISHMENT
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 1.15, marginBottom: 8 }}>
              {currentPunishment.text || "Not decided yet."}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{currentPunishment.sub || "The league votes before Week 1."}</div>
          </div>

          <CtaCard label="VOTES & POLLS" title="Punishments, rule changes, league decisions" href="/votes" cta="GO TO VOTES →" />
          <CtaCard label="2028 IN-PERSON DRAFT" title="Where are we drafting in 2028?" href="/vacation" cta="SEE THE PLAN →" />
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
