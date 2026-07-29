import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { avatarColor } from "@/lib/teams";
import { champions, records } from "@/lib/leagueData";

export default function HistoryPage() {
  return (
    <>
      <PageTitle>HISTORY &amp; HALL OF FAME</PageTitle>

      <div className="cg-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {champions.map((c) => (
          <div key={c.year} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: fonts.display, fontSize: 15, color: colors.brown60, marginBottom: 8 }}>{c.year}</div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: avatarColor(c.teamIndex),
                margin: "0 auto 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              🏆
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{c.team}</div>
          </div>
        ))}
      </div>

      <SectionLabel>ALL-TIME RECORDS</SectionLabel>
      <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
        {records.map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 24px", borderBottom: "1px solid rgba(49,29,0,0.06)" }}>
            <div style={{ fontSize: 14.5, color: colors.brown90 }}>{r.label}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, textAlign: "right" }}>{r.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
