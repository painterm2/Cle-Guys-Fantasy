"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { avatarColor } from "@/lib/teams";
import { draftOrder as manualOrder, draftVideos, SEASON_YEAR } from "@/lib/leagueData";
import type { DraftOrderData, DraftSlot } from "@/lib/espn";

interface DraftResponse {
  status: "live" | "unconfigured" | "error";
  data: DraftOrderData;
  needsCredentials: boolean;
  error?: string;
}

// The hand-entered order in leagueData is only a fallback for when ESPN can't
// be reached — it has no logos or manager names.
const manualSlots: DraftSlot[] = manualOrder.map((d) => ({
  pick: d.pick,
  teamId: -d.pick,
  team: d.team,
  abbrev: "",
  logo: null,
}));

export default function DraftPage() {
  const [order, setOrder] = useState<DraftSlot[]>(manualSlots);
  const [info, setInfo] = useState<Omit<DraftOrderData, "order"> | null>(null);
  const [meta, setMeta] = useState<{ live: boolean; needsCreds: boolean; error?: string }>({
    live: false,
    needsCreds: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/draft");
        const json = (await r.json()) as DraftResponse;
        if (!alive) return;
        const { order: live, ...rest } = json.data ?? { order: [] };
        if (json.status === "live" && live?.length > 0) {
          setOrder(live);
          setInfo(rest);
          setMeta({ live: true, needsCreds: false });
        } else {
          setOrder(manualSlots);
          setMeta({ live: false, needsCreds: json.needsCredentials, error: json.error });
        }
      } catch {
        if (alive) setMeta({ live: false, needsCreds: false, error: "Couldn't reach the draft API." });
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const when = info?.date ? new Date(info.date) : null;
  const heading = info?.drafted ? `${SEASON_YEAR} DRAFT — ROUND 1` : `${SEASON_YEAR} DRAFT ORDER`;

  return (
    <>
      <PageTitle sub="Draft order gets decided by video every year. Recaps live here.">DRAFT ORDER &amp; DRAFT DAY</PageTitle>

      <div style={{ background: colors.brown, borderRadius: 6, padding: "24px 26px", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap", marginBottom: order.length > 0 ? 16 : 10 }}>
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700 }}>
            {heading}
          </div>
          {meta.live && (
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.4, color: colors.creamMuted, fontWeight: 600 }}>
              LIVE FROM ESPN
            </div>
          )}
          {when && (
            <div style={{ fontSize: 13, color: colors.creamMuted }}>
              {info?.drafted ? "Drafted " : "Draft "}
              {when.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {info?.type ? ` · ${info.type.toLowerCase()}` : ""}
            </div>
          )}
          {info?.inProgress && (
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.4, color: colors.orange, fontWeight: 700 }}>
              DRAFT IN PROGRESS
            </div>
          )}
        </div>

        {order.length > 0 ? (
          <div className="cg-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {order.map((slot, i) => (
              <div
                key={`${slot.pick}-${slot.teamId}`}
                style={{
                  background: colors.cream,
                  borderRadius: 4,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 20,
                    color: slot.pick === 1 ? colors.orange : colors.brown70,
                    width: 26,
                    textAlign: "right",
                    flex: "none",
                  }}
                >
                  {slot.pick}
                </div>
                <Avatar name={slot.team} color={avatarColor(i)} logo={slot.logo} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: fonts.condensed,
                      fontWeight: 700,
                      fontSize: 15.5,
                      color: colors.brown,
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {slot.team}
                  </div>
                  {slot.owner && <div style={{ fontSize: 12.5, color: colors.brown70 }}>{slot.owner}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : !loaded ? (
          <div style={{ color: colors.creamMuted, fontSize: 15 }}>Loading the order from ESPN…</div>
        ) : meta.needsCreds ? (
          <div style={{ color: colors.cream, fontSize: 15 }}>
            The order fills in here automatically once the ESPN link is set up.
          </div>
        ) : (
          <div style={{ color: colors.cream, fontSize: 15 }}>
            Not set on ESPN yet — the order gets revealed by video before draft day. Check back once it&apos;s in.
          </div>
        )}

        {loaded && !meta.live && order.length > 0 && (
          <div style={{ fontSize: 12.5, color: colors.creamMuted, marginTop: 12 }}>
            Showing the last order we had on file — couldn&apos;t reach ESPN{meta.error ? ` (${meta.error})` : ""}.
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
