"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { SectionLabel } from "@/components/ui";
import { avatarColor } from "@/lib/teams";
import { champions as fallbackChampions, records as fallbackRecords } from "@/lib/leagueData";
import type { HistoryData } from "@/lib/espn";

interface Champ {
  year: string;
  team: string;
  owner?: string;
}

export default function HistoryPage() {
  const [champs, setChamps] = useState<Champ[]>(fallbackChampions.map((c) => ({ year: c.year, team: c.team })));
  const [records, setRecords] = useState(fallbackRecords);
  const [meta, setMeta] = useState<{ live: boolean; needsCreds: boolean; error?: string }>({ live: false, needsCreds: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/history");
        const json = (await r.json()) as { status: string; data: HistoryData; needsCredentials: boolean; error?: string };
        if (!alive) return;
        if (json.status === "live" && json.data.champions.length > 0) {
          setChamps(json.data.champions.map((c) => ({ year: String(c.year), team: c.team, owner: c.owner })));
          if (json.data.records.length > 0) setRecords(json.data.records);
          setMeta({ live: true, needsCreds: false });
        } else {
          setMeta({ live: false, needsCreds: json.needsCredentials, error: json.error });
        }
      } catch {
        if (alive) setMeta({ live: false, needsCreds: false, error: "Couldn't reach the history API." });
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
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: 0, fontWeight: 400 }}>HISTORY &amp; HALL OF FAME</h1>
      </div>

      <SourceBanner loaded={loaded} live={meta.live} needsCreds={meta.needsCreds} error={meta.error} />

      <SectionLabel>CHAMPIONS BY SEASON</SectionLabel>
      <div className="cg-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {champs.map((c, i) => (
          <div key={c.year} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: fonts.display, fontSize: 15, color: colors.brown60, marginBottom: 8 }}>{c.year}</div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: avatarColor(i),
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
            {c.owner && <div style={{ fontSize: 12.5, color: colors.brown60, marginTop: 3 }}>{c.owner}</div>}
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

function SourceBanner({ loaded, live, needsCreds, error }: { loaded: boolean; live: boolean; needsCreds: boolean; error?: string }) {
  if (!loaded) return <Banner tone="muted">Loading league history from ESPN…</Banner>;
  if (live) return <Banner tone="live">● Pulled live from ESPN league history</Banner>;
  if (needsCreds)
    return <Banner tone="warn">Showing sample history — add your ESPN cookies to load real champions &amp; records (see README).</Banner>;
  return <Banner tone="muted">Showing sample history — live ESPN history unavailable{error ? ` (${error})` : ""}.</Banner>;
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
