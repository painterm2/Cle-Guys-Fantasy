import Link from "next/link";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { currentPunishment, punishmentHistory, SEASON_YEAR } from "@/lib/leagueData";

export default function PunishmentsPage() {
  return (
    <>
      <PageTitle>PUNISHMENTS</PageTitle>

      <div style={{ background: colors.brown, borderRadius: 6, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 76,
            height: 76,
            flex: "none",
            borderRadius: "50%",
            background: colors.orange,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.display,
            fontSize: 28,
            color: "#fff",
          }}
        >
          P
        </div>
        <div>
          <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 2, color: colors.orange, fontWeight: 700, marginBottom: 6 }}>
            {currentPunishment.eyebrow}
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 24, color: colors.cream }}>{currentPunishment.text}</div>
        </div>
      </div>

      <SectionLabel>HALL OF SHAME — PAST SENTENCES</SectionLabel>
      {punishmentHistory.map((p) => (
        <div
          key={p.year}
          style={{ display: "flex", gap: 20, background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "16px 22px", marginBottom: 12, alignItems: "center" }}
        >
          <div style={{ fontFamily: fonts.display, fontSize: 20, color: colors.orange, width: 56, flex: "none" }}>{p.year}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{p.loser}</div>
            <div style={{ fontSize: 14, color: colors.brown80, marginTop: 2 }}>{p.punishment}</div>
          </div>
        </div>
      ))}

      <div style={{ background: colors.white, border: "2px dashed rgba(49,29,0,0.25)", borderRadius: 6, padding: "20px 26px", marginTop: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>No punishment locked in for {SEASON_YEAR} yet.</div>
        <Link
          href="/votes"
          style={{ display: "inline-block", background: colors.orange, color: "#fff", fontFamily: fonts.condensed, fontWeight: 600, letterSpacing: 0.5, fontSize: 13.5, padding: "9px 16px", borderRadius: 4 }}
        >
          VOTE ON IT →
        </Link>
      </div>
    </>
  );
}
