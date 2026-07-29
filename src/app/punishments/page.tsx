"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { SectionLabel } from "@/components/ui";
import { PunishmentProof } from "@/components/PunishmentProof";
import { currentPunishment, punishmentDescriptions, punishmentHistory, SEASON_YEAR } from "@/lib/leagueData";
import type { HistoryData } from "@/lib/espn";

interface ShameRow {
  year: string;
  loser: string;
  punishment: string;
}

const NO_PUNISHMENT = "No punishment assigned this year.";

export default function PunishmentsPage() {
  const [rows, setRows] = useState<ShameRow[]>(punishmentHistory);
  const [meta, setMeta] = useState<{ live: boolean; needsCreds: boolean; error?: string }>({ live: false, needsCreds: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/history");
        const json = (await r.json()) as { status: string; data: HistoryData; needsCredentials: boolean; error?: string };
        if (!alive) return;
        if (json.status === "live" && json.data.lastPlace.length > 0) {
          // Real last-place finishers from ESPN + our editable descriptions.
          setRows(
            json.data.lastPlace.map((lp) => ({
              year: String(lp.year),
              loser: lp.team,
              punishment: punishmentDescriptions[String(lp.year)] ?? NO_PUNISHMENT,
            })),
          );
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
      <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: "0 0 24px", fontWeight: 400 }}>PUNISHMENTS</h1>

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

      <PunishmentProof who="Peter" />

      <SectionLabel>HALL OF SHAME — PAST SENTENCES</SectionLabel>
      <SourceBanner loaded={loaded} live={meta.live} needsCreds={meta.needsCreds} error={meta.error} />

      {rows.map((p) => (
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

function SourceBanner({ loaded, live, needsCreds, error }: { loaded: boolean; live: boolean; needsCreds: boolean; error?: string }) {
  if (!loaded) return <Banner tone="muted">Loading last-place finishers from ESPN…</Banner>;
  if (live) return <Banner tone="live">● Losers pulled from ESPN (regular-season last place). Descriptions are editable in the code.</Banner>;
  if (needsCreds)
    return <Banner tone="warn">Showing sample history — add your ESPN cookies to load the real last-place finishers (see README).</Banner>;
  return <Banner tone="muted">Showing sample history — live ESPN history unavailable{error ? ` (${error})` : ""}.</Banner>;
}

function Banner({ tone, children }: { tone: "live" | "warn" | "muted"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    live: { background: "rgba(251,79,20,0.12)", color: colors.orange, border: "1px solid rgba(251,79,20,0.3)" },
    warn: { background: "#fff8f0", color: colors.brown, border: "1px solid rgba(251,79,20,0.3)" },
    muted: { background: colors.white, color: colors.brown80, border: `1px solid ${colors.cardBorder}` },
  };
  return (
    <div style={{ ...styles[tone], borderRadius: 6, padding: "10px 16px", fontSize: 13.5, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}
