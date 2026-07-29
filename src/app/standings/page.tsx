"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { LiveScoreboard } from "@/components/LiveScoreboard";
import { avatarColor } from "@/lib/teams";
import { espnLeagueUrl } from "@/lib/links";
import { fallbackStandings } from "@/lib/leagueData";
import type { TeamStanding } from "@/lib/espn";

interface Row {
  rank: number;
  name: string;
  owner?: string;
  logo: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
}

interface StandingsResponse {
  status: "live" | "unconfigured" | "error";
  data: TeamStanding[];
  needsCredentials: boolean;
  season: number;
  seasons?: number[];
  error?: string;
}

export default function StandingsPage() {
  const [rows, setRows] = useState<Row[]>(
    fallbackStandings.map((t) => ({ ...t, logo: null })),
  );
  const [meta, setMeta] = useState<{ live: boolean; needsCreds: boolean; season?: number; error?: string }>({
    live: false,
    needsCreds: false,
  });
  const [loaded, setLoaded] = useState(false);
  // null = the live/current season; a number = that past season.
  const [season, setSeason] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    (async () => {
      try {
        const r = await fetch(season == null ? "/api/standings" : `/api/standings?season=${season}`);
        const json = (await r.json()) as StandingsResponse;
        if (!alive) return;
        if (json.seasons) setSeasons(json.seasons);
        if (json.status === "live" && json.data.length > 0) {
          setRows(
            json.data.map((t) => ({
              rank: t.rank,
              name: t.name,
              owner: t.owner,
              logo: t.logo,
              wins: t.wins,
              losses: t.losses,
              ties: t.ties,
              pointsFor: t.pointsFor,
            })),
          );
          setMeta({ live: true, needsCreds: false, season: json.season });
        } else {
          // For a past season, showing the current roster with zeroes would be
          // misleading — leave it empty and say so instead.
          setRows(season == null ? fallbackStandings.map((t) => ({ ...t, logo: null })) : []);
          setMeta({ live: false, needsCreds: json.needsCredentials, season: json.season, error: json.error });
        }
      } catch {
        if (alive) setMeta({ live: false, needsCreds: false, error: "Could not reach the standings API." });
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [season]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: 0, fontWeight: 400 }}>STANDINGS</h1>
          <div style={{ fontSize: 14, color: colors.brown80, marginTop: 4 }}>
            Live from ESPN, with every past season back to 2019.
          </div>
        </div>
        <a
          href={espnLeagueUrl("standings")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: fonts.condensed, fontWeight: 700, fontSize: 14, letterSpacing: 0.5, border: `2px solid ${colors.brown}`, padding: "9px 16px", borderRadius: 4, color: colors.brown }}
        >
          OPEN IN ESPN ↗
        </a>
      </div>

      {seasons.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {seasons.map((y, i) => {
            const active = season == null ? i === 0 : season === y;
            return (
              <button
                key={y}
                onClick={() => setSeason(i === 0 ? null : y)}
                style={{
                  background: active ? colors.orange : colors.white,
                  color: active ? "#fff" : colors.brown80,
                  border: `1px solid ${active ? colors.orange : colors.cardBorder}`,
                  fontFamily: fonts.condensed,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: 0.5,
                  padding: "7px 13px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {y}
                {i === 0 ? " · NOW" : ""}
              </button>
            );
          })}
        </div>
      )}

      <StatusBanner loaded={loaded} live={meta.live} needsCreds={meta.needsCreds} season={meta.season} isPast={season != null} error={meta.error} />

      {loaded && rows.length === 0 ? (
        <div style={{ background: colors.white, border: "2px dashed rgba(49,29,0,0.2)", borderRadius: 6, padding: "26px 24px", textAlign: "center", fontSize: 14.5, color: colors.brown60, marginBottom: 28 }}>
          No ESPN standings available for {meta.season ?? season}.
        </div>
      ) : (
      <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden", marginBottom: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px 1fr 70px 70px 90px",
            padding: "12px 22px",
            fontFamily: fonts.condensed,
            fontSize: 12,
            letterSpacing: 1,
            fontWeight: 700,
            color: colors.brown90,
            borderBottom: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div>RK</div>
          <div>TEAM</div>
          <div>W</div>
          <div>L</div>
          <div>PF</div>
        </div>
        {rows.map((team, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr 70px 70px 90px",
              padding: "14px 22px",
              alignItems: "center",
              borderBottom: "1px solid rgba(49,29,0,0.06)",
            }}
          >
            <div style={{ fontFamily: fonts.display, fontSize: 16, color: i === 0 ? colors.orange : colors.brown55 }}>{team.rank}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar name={team.name} color={avatarColor(i)} logo={team.logo} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {team.name}
                </span>
                {team.owner && (
                  <span style={{ display: "block", fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown60, letterSpacing: 0.3 }}>
                    {team.owner}
                  </span>
                )}
              </span>
            </div>
            <div style={{ fontSize: 14 }}>{team.wins}</div>
            <div style={{ fontSize: 14 }}>{team.losses}</div>
            <div style={{ fontSize: 14 }}>{team.pointsFor.toLocaleString()}</div>
          </div>
        ))}
      </div>
      )}

      {season == null && <LiveScoreboard />}
    </>
  );
}

function StatusBanner({
  loaded,
  live,
  needsCreds,
  season,
  isPast,
  error,
}: {
  loaded: boolean;
  live: boolean;
  needsCreds: boolean;
  season?: number;
  isPast?: boolean;
  error?: string;
}) {
  if (!loaded) return <Banner tone="muted">Loading standings from ESPN…</Banner>;
  if (live && isPast) return <Banner tone="muted">Final {season} standings, from ESPN.</Banner>;
  if (live) return <Banner tone="live">● LIVE from ESPN{season ? ` · ${season} season` : ""}</Banner>;
  if (needsCreds)
    return (
      <Banner tone="warn">
        {isPast
          ? `Past standings load from ESPN once the link is set up.`
          : "Showing preview standings — the real numbers appear once the ESPN link is set up."}
      </Banner>
    );
  return (
    <Banner tone="muted">
      Showing preview standings — live ESPN data isn&apos;t available yet{error ? ` (${error})` : ""}. This lights up automatically once
      the season is underway.
    </Banner>
  );
}

function Banner({ tone, children }: { tone: "live" | "warn" | "muted"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    live: { background: "rgba(251,79,20,0.12)", color: colors.orange, border: "1px solid rgba(251,79,20,0.3)" },
    warn: { background: "#fff8f0", color: colors.brown, border: "1px solid rgba(251,79,20,0.3)" },
    muted: { background: colors.white, color: colors.brown80, border: `1px solid ${colors.cardBorder}` },
  };
  return (
    <div style={{ ...styles[tone], borderRadius: 6, padding: "10px 16px", fontSize: 13.5, marginBottom: 20, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}
