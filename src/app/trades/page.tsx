"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle } from "@/components/ui";
import { OwnerPicker, useActor } from "@/components/OwnerPicker";
import { Avatar } from "@/components/Avatar";
import { TEAMS, avatarColor } from "@/lib/teams";
import { POSITIONS } from "@/lib/leagueData";
import { useSharedStore, logFeed, timeAgo } from "@/lib/sharedStore";
import { useTeamLogos, logoFor } from "@/lib/useTeamLogos";

interface Board {
  looking: string[];
  offering: string[];
  players: string[];
  updatedAt: string | null; // ISO; null = never posted
}

const emptyBoards = (): Board[] => TEAMS.map(() => ({ looking: [], offering: [], players: [], updatedAt: null }));

export default function TradesPage() {
  const { data: boards, loaded, shared, error, mutate } = useSharedStore<Board[]>("trade-boards", emptyBoards());
  const logos = useTeamLogos();
  const { owner, setOwner, actor } = useActor();
  const [editing, setEditing] = useState<number | null>(null);

  const update = (idx: number, patch: Partial<Board>) => {
    mutate((cur) => {
      const base = cur.length === TEAMS.length ? cur : emptyBoards();
      return base.map((b, i) => (i === idx ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b));
    });
  };

  const toggle = (idx: number, field: "looking" | "offering", code: string) => {
    const cur = boards[idx]?.[field] ?? [];
    update(idx, { [field]: cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code] } as Partial<Board>);
  };

  const finishEditing = (idx: number) => {
    setEditing(null);
    // Anyone can edit any board, so name both the editor and the board.
    logFeed(actor, idx === TEAMS.indexOf(actor) ? "updated their trade board." : `updated the ${TEAMS[idx]} trade board.`, idx);
  };

  return (
    <>
      <PageTitle sub="Every team gets a board. Update yours any time — everyone in the league sees it and can needle you about it.">
        TRADE BOARD
      </PageTitle>

      {!shared && loaded && (
        <div style={{ background: "#fff8f0", border: "1px solid rgba(251,79,20,0.3)", borderRadius: 6, padding: "10px 16px", fontSize: 13.5, color: colors.brown, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
          Shared saving isn't connected yet — for now, board edits only save on this device.
        </div>
      )}
      {error && <div style={{ color: colors.orange, fontSize: 13.5, marginBottom: 12, fontFamily: fonts.condensed }}>{error}</div>}

      <OwnerPicker owner={owner} onChange={setOwner} note="Saved on this device — board edits get credited to your team." />

      <div className="cg-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {TEAMS.map((team, i) => {
          const b: Board = boards[i] ?? { looking: [], offering: [], players: [], updatedAt: null };
          const posted = b.updatedAt != null;
          const isEditing = editing === i;
          return (
            <div key={team} style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={team} color={avatarColor(i)} logo={logoFor(logos, team)} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</div>
                  <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown60, letterSpacing: 0.3 }}>
                    {posted ? `Updated ${timeAgo(b.updatedAt!)}` : "No updates yet"}
                  </div>
                </div>
                <button
                  onClick={() => (isEditing ? finishEditing(i) : setEditing(i))}
                  style={{ background: "none", border: "none", fontFamily: fonts.condensed, fontSize: 12, fontWeight: 600, color: colors.orange, cursor: "pointer", flex: "none" }}
                >
                  {isEditing ? "DONE" : "EDIT"}
                </button>
              </div>

              {posted || isEditing ? (
                <div style={{ background: "#f8f4ea", borderRadius: 5, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <ChipRow label="LOOKING FOR" labelColor={colors.orange}>
                    {POSITIONS.map((code) => {
                      const on = b.looking.includes(code);
                      return (
                        <Chip key={code} code={code} active={on} activeBg={colors.orange} activeColor="#fff" editable={isEditing} onClick={() => toggle(i, "looking", code)} />
                      );
                    })}
                  </ChipRow>

                  <ChipRow label="OFFERING" labelColor={colors.brown90}>
                    {POSITIONS.map((code) => {
                      const on = b.offering.includes(code);
                      return (
                        <Chip key={code} code={code} active={on} activeBg={colors.brown} activeColor={colors.cream} editable={isEditing} onClick={() => toggle(i, "offering", code)} />
                      );
                    })}
                  </ChipRow>

                  {(b.players.length > 0 || isEditing) && (
                    <PlayersRow players={b.players} editable={isEditing} onChange={(players) => update(i, { players })} />
                  )}
                </div>
              ) : (
                <div style={{ border: "2px dashed rgba(49,29,0,0.2)", borderRadius: 5, padding: 14, textAlign: "center", fontSize: 13.5, color: colors.brown60 }}>
                  Nothing posted — update your board
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChipRow({ label, labelColor, children }: { label: string; labelColor: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: fonts.condensed, fontSize: 11, letterSpacing: 1.2, fontWeight: 700, color: labelColor, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Chip({ code, active, activeBg, activeColor, editable, onClick }: { code: string; active: boolean; activeBg: string; activeColor: string; editable: boolean; onClick: () => void }) {
  return (
    <div
      onClick={editable ? onClick : undefined}
      style={{
        fontFamily: fonts.condensed,
        fontWeight: 700,
        fontSize: 12,
        padding: "5px 10px",
        borderRadius: 4,
        background: active ? activeBg : "#efe6d5",
        color: active ? activeColor : colors.brown60,
        cursor: editable ? "pointer" : "default",
        outline: editable ? "1px dashed rgba(49,29,0,0.2)" : "none",
        userSelect: "none",
      }}
    >
      {code}
    </div>
  );
}

function PlayersRow({ players, editable, onChange }: { players: string[]; editable: boolean; onChange: (p: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div style={{ fontFamily: fonts.condensed, fontSize: 11, letterSpacing: 1.2, fontWeight: 700, color: colors.brown90, marginBottom: 6 }}>PLAYERS AVAILABLE</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {players.map((pl, idx) => (
          <div key={idx} style={{ fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 20, background: "#fff", border: "1px solid rgba(49,29,0,0.15)", color: colors.brown, display: "inline-flex", gap: 6, alignItems: "center" }}>
            {pl}
            {editable && (
              <span onClick={() => onChange(players.filter((_, i) => i !== idx))} style={{ cursor: "pointer", color: colors.orange, fontWeight: 700 }}>
                ×
              </span>
            )}
          </div>
        ))}
        {editable && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onChange([...players, draft.trim()]);
                setDraft("");
              }
            }}
            placeholder="+ add player, Enter"
            style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 20, border: "1px dashed rgba(49,29,0,0.3)", background: "#fff", outline: "none", fontFamily: fonts.body, width: 150 }}
          />
        )}
      </div>
    </div>
  );
}
