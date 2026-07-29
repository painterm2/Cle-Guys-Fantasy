"use client";

import { colors, fonts } from "@/lib/theme";
import { useCommish } from "@/components/CommishProvider";
import { ruleGroups } from "@/lib/leagueData";

export default function RulesPage() {
  const { commish } = useCommish();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: 0, fontWeight: 400 }}>LEAGUE RULES</h1>
        {commish && (
          <button
            style={{
              background: colors.orange,
              color: "#fff",
              border: "none",
              fontFamily: fonts.condensed,
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 0.5,
              padding: "9px 16px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            + ADD RULE
          </button>
        )}
      </div>

      {ruleGroups.map((grp) => (
        <div
          key={grp.title}
          style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px", marginBottom: 16 }}
        >
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700, marginBottom: 14 }}>
            {grp.title}
          </div>
          {grp.rules.map((rule) => (
            <div key={rule.num} style={{ display: "flex", gap: 14, padding: "10px 0", borderTop: "1px solid rgba(49,29,0,0.07)" }}>
              <div style={{ fontFamily: fonts.display, fontSize: 15, color: colors.brown55, flex: "none" }}>{rule.num}</div>
              <div style={{ fontSize: 15, lineHeight: 1.5, flex: 1 }}>{rule.text}</div>
              {commish && (
                <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown60, cursor: "pointer", flex: "none", alignSelf: "center" }}>
                  EDIT
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
