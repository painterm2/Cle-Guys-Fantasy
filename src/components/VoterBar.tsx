"use client";

import { colors, fonts } from "@/lib/theme";
import { OWNERS } from "@/lib/polls";

/**
 * "Voting as" picker shown above polls. Each manager selects who they are
 * (remembered on this device); ballots are recorded against that owner so
 * everyone gets exactly one vote per poll, league-wide.
 */
export function VoterBar({ voter, onChange }: { voter: string; onChange: (name: string) => void }) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "12px 18px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: colors.brown90, flex: "none" }}>
        VOTING AS
      </div>
      <select
        value={voter}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: 14, padding: "8px 10px", borderRadius: 4, border: `1px solid ${voter ? colors.cardBorder : colors.orange}`, fontFamily: fonts.body, background: "#fff", color: colors.brown, minWidth: 180 }}
      >
        <option value="">Who are you?</option>
        {OWNERS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <div style={{ fontSize: 12.5, color: colors.brown70, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
        One vote each · votes are anonymous — only the tally is shown.
      </div>
    </div>
  );
}
