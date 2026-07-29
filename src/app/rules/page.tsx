"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { SectionLabel } from "@/components/ui";
import { ruleGroups } from "@/lib/leagueData";
import type { SettingsGroup } from "@/lib/espn";

export default function RulesPage() {
  const [espnGroups, setEspnGroups] = useState<SettingsGroup[]>([]);
  const [meta, setMeta] = useState<{ live: boolean; needsCreds: boolean; error?: string }>({ live: false, needsCreds: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/settings");
        const json = (await r.json()) as { status: string; data: SettingsGroup[]; needsCredentials: boolean; error?: string };
        if (!alive) return;
        if (json.status === "live" && json.data.length > 0) {
          setEspnGroups(json.data);
          setMeta({ live: true, needsCreds: false });
        } else {
          setMeta({ live: false, needsCreds: json.needsCredentials, error: json.error });
        }
      } catch {
        if (alive) setMeta({ live: false, needsCreds: false, error: "Couldn't reach the settings API." });
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
      <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: "0 0 24px", fontWeight: 400 }}>LEAGUE RULES</h1>

      <SectionLabel>HOUSE RULES</SectionLabel>
      {ruleGroups.map((grp) => (
        <RuleCard key={grp.title} title={grp.title} rules={grp.rules} />
      ))}

      <div style={{ height: 12 }} />
      <SectionLabel>LEAGUE SETTINGS{meta.live ? " — LIVE FROM ESPN" : ""}</SectionLabel>

      {!loaded && <Banner tone="muted">Loading league settings from ESPN…</Banner>}
      {loaded && !meta.live && meta.needsCreds && (
        <Banner tone="warn">League settings fill in automatically from ESPN once the link is set up.</Banner>
      )}
      {loaded && !meta.live && !meta.needsCreds && (
        <Banner tone="muted">Live ESPN settings unavailable{meta.error ? ` (${meta.error})` : ""}.</Banner>
      )}

      {espnGroups.map((grp) => (
        <RuleCard key={grp.title} title={grp.title} rules={grp.rules} />
      ))}
    </>
  );
}

function RuleCard({ title, rules }: { title: string; rules: { num: string; text: string }[] }) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 16 }}>
      <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700, marginBottom: 14 }}>
        {title}
      </div>
      {rules.map((rule) => (
        <div key={rule.num} style={{ display: "flex", gap: 14, padding: "10px 0", borderTop: "1px solid rgba(49,29,0,0.07)" }}>
          <div style={{ fontFamily: fonts.display, fontSize: 15, color: colors.brown55, flex: "none" }}>{rule.num}</div>
          <div style={{ fontSize: 15, lineHeight: 1.5, flex: 1 }}>{rule.text}</div>
        </div>
      ))}
    </div>
  );
}

function Banner({ tone, children }: { tone: "warn" | "muted"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    warn: { background: "#fff8f0", color: colors.brown, border: "1px solid rgba(251,79,20,0.3)" },
    muted: { background: colors.white, color: colors.brown80, border: `1px solid ${colors.cardBorder}` },
  };
  return (
    <div style={{ ...styles[tone], borderRadius: 6, padding: "10px 16px", fontSize: 13.5, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}
