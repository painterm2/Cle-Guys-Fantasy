"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { SectionLabel } from "@/components/ui";
import { OwnerPicker, useActor } from "@/components/OwnerPicker";
import { useSharedStore, logFeed } from "@/lib/sharedStore";
import { makeRuleProposal, ruleOutcome, MAJORITY, OWNERS, type Poll } from "@/lib/polls";
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
      <ProposeRule />

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

/** Propose a rule → creates a Yay/Nay poll that passes on a league majority. */
function ProposeRule() {
  const { owner, setOwner, actor, identified } = useActor();
  const { data: polls, loaded, mutate } = useSharedStore<Poll[]>("polls", []);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const proposals = polls.filter((p) => p.kind === "rule");

  const submit = () => {
    const rule = text.trim();
    if (!rule || !identified) return;
    mutate((cur) => [makeRuleProposal(rule, actor), ...cur]);
    logFeed(actor, `proposed a rule: “${rule}”`);
    setText("");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <>
      <SectionLabel color={colors.orange}>PROPOSE A RULE</SectionLabel>

      <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: colors.brown80, marginBottom: 14, lineHeight: 1.5 }}>
          Write it out and it goes to the league as a yay-or-nay vote. It needs{" "}
          <strong>{MAJORITY} of {OWNERS.length}</strong> managers to vote yay to pass.
        </div>

        <OwnerPicker owner={owner} onChange={setOwner} note="Saved on this device — your proposal gets credited to your team." />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={!identified}
          placeholder={identified ? "e.g. Trades lock at the start of Week 11." : "Pick your team above to propose a rule"}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontSize: 14.5,
            padding: "11px 13px",
            borderRadius: 4,
            border: `1px solid ${colors.cardBorder}`,
            outline: "none",
            fontFamily: fonts.body,
            resize: "vertical",
            marginBottom: 12,
          }}
        />

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={submit}
            disabled={!identified || !text.trim()}
            title={identified ? undefined : "Pick your team first"}
            style={{
              background: identified && text.trim() ? colors.orange : "#e6ddcb",
              color: identified && text.trim() ? "#fff" : colors.brown60,
              border: "none",
              fontFamily: fonts.condensed,
              fontWeight: 600,
              fontSize: 13.5,
              letterSpacing: 0.5,
              padding: "11px 20px",
              borderRadius: 4,
              cursor: identified && text.trim() ? "pointer" : "default",
            }}
          >
            SEND TO A VOTE
          </button>
          {sent && (
            <span style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.orange, letterSpacing: 0.3 }}>
              ✓ Sent — it&apos;s live on Votes &amp; Polls.
            </span>
          )}
        </div>
      </div>

      {loaded && proposals.length > 0 && (
        <>
          <SectionLabel>PROPOSALS ON THE FLOOR</SectionLabel>
          <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "8px 26px 18px", marginBottom: 16 }}>
            {proposals.map((p) => {
              const o = ruleOutcome(p);
              const tone =
                o.status === "passed" ? "#22783C" : o.status === "failed" ? colors.brown60 : colors.orange;
              return (
                <div key={p.id} style={{ padding: "12px 0", borderTop: "1px solid rgba(49,29,0,0.07)" }}>
                  <div style={{ fontSize: 15, lineHeight: 1.45 }}>{p.question}</div>
                  <div style={{ fontFamily: fonts.condensed, fontSize: 12.5, letterSpacing: 0.4, color: tone, fontWeight: 700, marginTop: 4 }}>
                    {o.status === "passed"
                      ? `✓ PASSED · ${o.yay} yay`
                      : o.status === "failed"
                        ? `✗ REJECTED · ${o.nay} nay`
                        : `PENDING · ${o.yay}/${MAJORITY} yay needed`}
                    {p.proposedBy ? ` · proposed by ${p.proposedBy}` : ""}
                  </div>
                </div>
              );
            })}
            <Link
              href="/votes"
              style={{ display: "inline-block", marginTop: 12, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, color: colors.orange }}
            >
              GO VOTE →
            </Link>
          </div>
        </>
      )}
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
