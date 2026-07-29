import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { draftOrder, draftVideos, SEASON_YEAR } from "@/lib/leagueData";

export default function DraftPage() {
  return (
    <>
      <PageTitle sub="Draft order gets decided by video every year. Recaps live here.">DRAFT ORDER &amp; DRAFT DAY</PageTitle>

      <div style={{ background: colors.brown, borderRadius: 6, padding: "24px 26px", marginBottom: 28, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700 }}>
          {SEASON_YEAR} DRAFT ORDER
        </div>
        {draftOrder.length > 0 ? (
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
        ) : (
          <div style={{ flex: 1, color: colors.cream, fontSize: 15 }}>
            Not chosen yet — the order gets decided by video on draft day. Check back once it&apos;s set.
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
