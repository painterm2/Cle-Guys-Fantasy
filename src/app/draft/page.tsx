import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { draftOrder, draftVideos, SEASON_YEAR } from "@/lib/leagueData";

export default function DraftPage() {
  return (
    <>
      <PageTitle sub="Draft order gets decided by video every year. Recaps live here.">DRAFT ORDER &amp; DRAFT DAY</PageTitle>

      <div style={{ background: colors.brown, borderRadius: 6, padding: "24px 26px", marginBottom: 28, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700, paddingTop: 8 }}>
          {SEASON_YEAR} DRAFT ORDER
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1, alignItems: "flex-start" }}>
          {draftOrder.map((d) => (
            <div
              key={d.pick}
              style={{ background: colors.cream, borderRadius: 4, padding: "8px 12px", fontFamily: fonts.condensed, fontWeight: 700, fontSize: 14, color: colors.brown, lineHeight: 1.3, maxWidth: 180 }}
            >
              {d.pick}. {d.team}
            </div>
          ))}
        </div>
      </div>

      <SectionLabel>ORDER REVEAL VIDEOS — BY YEAR</SectionLabel>
      <div className="cg-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {draftVideos.map((v) => (
          <div key={v.year} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden", cursor: "pointer" }}>
            <div
              style={{
                aspectRatio: "16/9",
                background: "repeating-linear-gradient(45deg,#e8ddc8 0 10px,#ddd0b6 10px 20px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(49,29,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `13px solid ${colors.cream}`, marginLeft: 3 }} />
              </div>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{v.year} Reveal</div>
              <div style={{ fontSize: 12.5, color: colors.brown80, marginTop: 2 }}>{v.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
