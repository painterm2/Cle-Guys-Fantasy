"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { OWNERS, getMyOwner, setMyOwner } from "@/lib/polls";

/**
 * "Who are you?" selector. Remembers the pick on this device so each manager
 * only chooses once. Voting is keyed off this so one owner = one ballot,
 * even across devices.
 */
export function useMyOwner(): [string, (name: string) => void] {
  const [owner, setOwner] = useState("");

  useEffect(() => {
    setOwner(getMyOwner());
  }, []);

  const choose = (name: string) => {
    setMyOwner(name);
    setOwner(name);
  };

  return [owner, choose];
}

export function OwnerPicker({ owner, onChange }: { owner: string; onChange: (name: string) => void }) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${owner ? colors.cardBorder : colors.orange}`,
        borderRadius: 6,
        padding: "12px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: owner ? colors.brown90 : colors.orange, flex: "none" }}>
        {owner ? "VOTING AS" : "WHO ARE YOU?"}
      </div>
      <select
        value={owner}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 14,
          padding: "8px 12px",
          borderRadius: 4,
          border: `1px solid ${colors.cardBorder}`,
          fontFamily: fonts.body,
          background: "#fff",
          color: colors.brown,
          cursor: "pointer",
          minWidth: 190,
        }}
      >
        <option value="">Select your name…</option>
        {OWNERS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <div style={{ fontSize: 12.5, color: colors.brown70, flex: 1, minWidth: 180 }}>
        {owner
          ? "Saved on this device — your votes stay anonymous to everyone but the commish."
          : "Pick your name so you can vote. One vote per manager; votes are anonymous."}
      </div>
    </div>
  );
}
