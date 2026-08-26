"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel, EmptyState } from "@/components/ui";
import { useCommish } from "@/components/CommishProvider";
import type { DraftBoard, DraftPlayer } from "@/lib/espn";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"];
const FLEX_OK = ["RB", "WR", "TE"];
const POS_COLOR: Record<string, string> = {
  QB: "#C2415B", RB: "#2F855A", WR: "#2B6CB0", TE: "#7B4BA8", K: "#6B7280", DST: "#6B7A3A",
};
const MY_TEAM_KEY = "cg-draft-myteam";
const ORDER_KEY = "cg-draft-order";

export default function DraftRoomPage() {
  const { commish } = useCommish();
  const [board, setBoard] = useState<DraftBoard | null>(null);
  const [meta, setMeta] = useState<{ loaded: boolean; error?: string; needsCreds?: boolean }>({ loaded: false });
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [compare, setCompare] = useState<number[]>([]);
  const [live, setLive] = useState(true);
  const [manualOrder, setManualOrder] = useState<number[] | null>(null);
  const [editOrder, setEditOrder] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MY_TEAM_KEY);
    if (saved) setMyTeamId(Number(saved));
    const ord = localStorage.getItem(ORDER_KEY);
    if (ord) {
      try {
        const parsed = JSON.parse(ord);
        if (Array.isArray(parsed) && parsed.length) setManualOrder(parsed);
      } catch {}
    }
  }, []);

  const pull = useCallback(async () => {
    try {
      const r = await fetch("/api/draft?limit=350", { cache: "no-store" });
      const json = (await r.json()) as { status: string; data: DraftBoard | null; needsCredentials: boolean; error?: string };
      if (json.status === "live" && json.data) {
        setBoard(json.data);
        setMeta({ loaded: true });
        setFetchedAt(new Date());
      } else {
        setMeta({ loaded: true, error: json.error, needsCreds: json.needsCredentials });
      }
    } catch {
      setMeta({ loaded: true, error: "Couldn't reach the draft feed." });
    }
  }, []);

  useEffect(() => {
    if (!commish) return;
    pull();
  }, [commish, pull]);

  useEffect(() => {
    if (!commish || !live) return;
    timer.current = setInterval(pull, 12000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [commish, live, pull]);

  // ---- derived ----------------------------------------------------------
  const takenIds = useMemo(() => new Set((board?.picks ?? []).map((p) => p.playerId)), [board]);
  const available = useMemo(
    () => (board?.players ?? []).filter((p) => !takenIds.has(p.id)),
    [board, takenIds],
  );

  const teamCount = board?.teams.length || 10;
  const orderSource: "manual" | "espn" | "fallback" = !board
    ? "fallback"
    : manualOrder && manualOrder.length === teamCount
      ? "manual"
      : board.draftOrder.length === teamCount
        ? "espn"
        : "fallback";

  const order = useMemo(() => {
    if (!board) return [];
    if (manualOrder && manualOrder.length === board.teams.length) return manualOrder;
    if (board.draftOrder.length === board.teams.length) return board.draftOrder;
    return board.teams.map((t) => t.id);
  }, [board, manualOrder]);

  const saveOrder = (next: number[]) => {
    setManualOrder(next);
    localStorage.setItem(ORDER_KEY, JSON.stringify(next));
  };
  const moveTeam = (i: number, d: number) => {
    const cur = order.slice();
    const j = i + d;
    if (j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    saveOrder(cur);
  };

  const madeCount = board?.picks.length ?? 0;
  const nextOverall = madeCount + 1;

  const teamForPick = useCallback(
    (overall: number) => {
      if (!order.length) return null;
      const round = Math.ceil(overall / order.length);
      const idx = (overall - 1) % order.length;
      return round % 2 === 1 ? order[idx] : order[order.length - 1 - idx];
    },
    [order],
  );

  const myNextPick = useMemo(() => {
    if (!board || myTeamId == null || !order.length) return null;
    const max = order.length * (board.rounds || 16);
    for (let n = nextOverall; n <= max; n++) if (teamForPick(n) === myTeamId) return n;
    return null;
  }, [board, myTeamId, order, nextOverall, teamForPick]);

  const gap = myNextPick ? myNextPick - nextOverall : 0;

  const myPlayers = useMemo(() => {
    if (!board || myTeamId == null) return [];
    const byId = new Map(board.players.map((p) => [p.id, p]));
    return board.picks
      .filter((p) => p.teamId === myTeamId)
      .map((p) => byId.get(p.playerId))
      .filter(Boolean) as DraftPlayer[];
  }, [board, myTeamId]);

  /** Fill the real lineup slots greedily; leftovers are bench. */
  const roster = useMemo(() => {
    const lineup = board?.lineup ?? [];
    const used = new Set<number>();
    const pool = myPlayers.slice().sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    const filled: { label: string; player: DraftPlayer | null }[] = [];

    const take = (label: string, ok: (p: DraftPlayer) => boolean) => {
      const hit = pool.find((p) => !used.has(p.id) && ok(p));
      if (hit) used.add(hit.id);
      filled.push({ label, player: hit ?? null });
    };

    lineup.filter((s) => s.pos !== "FLEX").forEach((s) => {
      for (let i = 0; i < s.count; i++) take(s.pos, (p) => p.pos === s.pos);
    });
    lineup.filter((s) => s.pos === "FLEX").forEach((s) => {
      for (let i = 0; i < s.count; i++) take("FLEX", (p) => FLEX_OK.includes(p.pos));
    });

    return { filled, bench: pool.filter((p) => !used.has(p.id)) };
  }, [board, myPlayers]);

  const needs = useMemo(() => {
    const n: Record<string, number> = {};
    roster.filled.forEach((s) => {
      if (!s.player) n[s.label] = (n[s.label] || 0) + 1;
    });
    return n;
  }, [roster]);

  /** What to target next — all of it derived from the live board. */
  const recs = useMemo(() => {
    if (!available.length) return [];
    const goneSoon = new Set(available.slice(0, Math.max(0, gap)).map((p) => p.id));
    const recent = board?.picks.slice(-8) ?? [];
    const byId = new Map((board?.players ?? []).map((p) => [p.id, p]));
    const runOf = (pos: string) => recent.filter((pk) => byId.get(pk.playerId)?.pos === pos).length;

    return POSITIONS.map((pos) => {
      const list = available.filter((p) => p.pos === pos);
      if (!list.length) return null;
      const best = list[0];
      const survivors = list.filter((p) => !goneSoon.has(p.id));
      const nextBest = survivors[0] ?? null;

      const directNeed = needs[pos] || 0;
      const flexOpen = FLEX_OK.includes(pos) ? needs.FLEX || 0 : 0;
      const vanishing = list.length - survivors.length;
      const dropoff =
        nextBest && best.projected != null && nextBest.projected != null
          ? Math.round((best.projected - nextBest.projected) * 10) / 10
          : null;
      const rankGap = nextBest ? (nextBest.rank ?? 999) - (best.rank ?? 0) : 999;

      let score = 0;
      score += directNeed * 34;
      score += flexOpen * 16;
      score += Math.min(rankGap, 60) * 0.8;
      score += vanishing * 2.2;
      score += runOf(pos) * 3.5;
      if (!directNeed && !flexOpen) score -= 26;
      if (pos === "K" || pos === "DST") score -= 45;

      const reasons: string[] = [];
      if (directNeed >= 1) reasons.push(`${directNeed} starting ${pos} slot${directNeed > 1 ? "s" : ""} open`);
      else if (flexOpen >= 1) reasons.push(`your FLEX is open`);
      if (vanishing > 0 && gap > 0) reasons.push(`${vanishing} likely gone before your pick`);
      if (dropoff != null && dropoff >= 8) reasons.push(`waiting costs ~${dropoff} projected pts`);
      else if (rankGap >= 12) reasons.push(`next best is ${rankGap} spots down`);
      if (runOf(pos) >= 3) reasons.push(`${runOf(pos)} of the last 8 picks were ${pos}`);
      if (!reasons.length) reasons.push(`${list.length} left, best ranked #${best.rank ?? "—"}`);

      return { pos, score, best, reasons };
    })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 3) as { pos: string; score: number; best: DraftPlayer; reasons: string[] }[];
  }, [available, gap, needs, board]);

  const posRankOf = useCallback(
    (p: DraftPlayer) => {
      const same = (board?.players ?? []).filter((x) => x.pos === p.pos);
      return same.findIndex((x) => x.id === p.id) + 1;
    },
    [board],
  );

  const shown = useMemo(() => {
    let list = available;
    if (filter !== "ALL") list = list.filter((p) => p.pos === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list.slice(0, 200);
  }, [available, filter, query]);

  const compared = useMemo(
    () => compare.map((id) => board?.players.find((p) => p.id === id)).filter(Boolean) as DraftPlayer[],
    [compare, board],
  );

  const toggleCompare = (id: number) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));

  // ---- gate -------------------------------------------------------------
  if (!commish) {
    return (
      <>
        <PageTitle>DRAFT ROOM</PageTitle>
        <EmptyState>This one&apos;s commish-only. Turn on Commish Mode in the sidebar to open it.</EmptyState>
      </>
    );
  }

  const onClockTeam = board ? board.teams.find((t) => t.id === teamForPick(nextOverall)) : null;
  const myTeam = board?.teams.find((t) => t.id === myTeamId) ?? null;
  const roundOf = (n: number) => Math.ceil(n / (order.length || 10));
  const slotOf = (n: number) => ((n - 1) % (order.length || 10)) + 1;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <PageTitle sub="Live from ESPN — players, picks and projections update as the draft runs.">DRAFT ROOM</PageTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={myTeamId ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMyTeamId(v);
              localStorage.setItem(MY_TEAM_KEY, String(v));
            }}
            style={sel}
          >
            <option value="">Which team is yours?</option>
            {board?.teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button onClick={() => setLive((v) => !v)} style={btn(live)}>
            {live ? "● LIVE" : "PAUSED"}
          </button>
          <button onClick={() => setEditOrder((v) => !v)} style={btn(editOrder)}>ORDER</button>
          <button onClick={pull} style={btn(false)}>REFRESH</button>
        </div>
      </div>

      {!meta.loaded && <Banner>Loading the board from ESPN…</Banner>}
      {meta.loaded && meta.error && (
        <Banner tone="warn">
          {meta.needsCreds
            ? "The ESPN link isn't set up, so the draft feed can't load."
            : `Couldn't load the draft board — ${meta.error}`}
        </Banner>
      )}

      {board?.warning && <Banner tone="warn">{board.warning}</Banner>}

      {board && (
        <>
          {/* clock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center", background: colors.brown, borderRadius: 6, padding: "18px 24px", marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div style={lab}>{board.complete ? "DRAFT COMPLETE" : "ON THE CLOCK"}</div>
              <div style={{ fontFamily: fonts.display, fontSize: 25, color: onClockTeam?.id === myTeamId ? colors.orange : colors.cream }}>
                {board.complete ? `${madeCount} picks made` : onClockTeam?.name ?? "—"}
              </div>
              <div style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.creamMuted, letterSpacing: 0.4 }}>
                {board.complete
                  ? ""
                  : `Pick ${roundOf(nextOverall)}.${String(slotOf(nextOverall)).padStart(2, "0")} · #${nextOverall} overall${onClockTeam?.owner ? ` · ${onClockTeam.owner}` : ""}`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={lab}>YOUR NEXT PICK</div>
              <div style={{ fontFamily: fonts.display, fontSize: 30, color: colors.cream }}>
                {myNextPick ? `${roundOf(myNextPick)}.${String(slotOf(myNextPick)).padStart(2, "0")}` : "—"}
              </div>
              <div style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.creamMuted }}>
                {myTeamId == null ? "pick your team above" : gap === 0 ? "you're up" : gap > 0 ? `${gap} picks away` : "—"}
              </div>
            </div>
          </div>

          {/* draft order: where it came from, and a manual fix */}
          {orderSource === "fallback" && (
            <Banner tone="warn">
              ESPN hasn&apos;t published a draft order yet, so this is just team order — set it with <strong>ORDER</strong> or the clock will be wrong.
            </Banner>
          )}

          {editOrder && (
            <div style={{ background: colors.white, border: `1px solid ${colors.orange}`, borderRadius: 6, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <SectionLabel>
                  DRAFT ORDER — {orderSource === "manual" ? "SET BY YOU" : orderSource === "espn" ? "FROM ESPN" : "NOT SET"}
                </SectionLabel>
                {manualOrder && (
                  <button
                    onClick={() => {
                      setManualOrder(null);
                      localStorage.removeItem(ORDER_KEY);
                    }}
                    style={chip(false)}
                  >
                    Use ESPN&apos;s
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, color: colors.brown80, marginBottom: 10 }}>
                Top to bottom is pick 1.01 through 1.{String(order.length).padStart(2, "0")}. Snake reverses each round.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {order.map((tid, i) => {
                  const t = board.teams.find((x) => x.id === tid);
                  return (
                    <div key={tid} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto auto", gap: 8, alignItems: "center", background: tid === myTeamId ? "#fff8f0" : "#f8f4ea", border: `1px solid ${tid === myTeamId ? colors.orange : "transparent"}`, borderRadius: 4, padding: "7px 10px" }}>
                      <span style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown60 }}>1.{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t?.name ?? `Team ${tid}`}
                        {t?.owner ? <span style={{ color: colors.brown60, fontFamily: fonts.condensed, fontSize: 11 }}> · {t.owner}</span> : null}
                      </span>
                      <button onClick={() => moveTeam(i, -1)} disabled={i === 0} style={chip(false)}>↑</button>
                      <button onClick={() => moveTeam(i, 1)} disabled={i === order.length - 1} style={chip(false)}>↓</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* recommendations */}
          <SectionLabel>TARGET NEXT{gap > 0 ? ` — ${gap} PICKS UNTIL YOU'RE UP` : ""}</SectionLabel>
          <div className="cg-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {recs.length === 0 && <EmptyState>Nothing to recommend yet.</EmptyState>}
            {recs.map((r, i) => (
              <div key={r.pos} style={{ background: colors.white, border: `1px solid ${i === 0 ? colors.orange : colors.cardBorder}`, borderRadius: 6, padding: "14px 16px" }}>
                <div style={{ fontFamily: fonts.display, fontSize: 22, color: POS_COLOR[r.pos] }}>{r.pos}</div>
                <div style={{ fontSize: 13, color: colors.brown80, lineHeight: 1.5, marginTop: 2 }}>
                  {r.reasons.slice(0, 2).join(" · ")}
                </div>
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${colors.cardBorder}`, fontSize: 14 }}>
                  <strong>{r.best.name}</strong>{" "}
                  <span style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown60 }}>
                    #{r.best.rank ?? "—"}{r.best.proTeam ? ` · ${r.best.proTeam}` : ""}{r.best.projected != null ? ` · ${r.best.projected} proj` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="cg-split" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
            {/* pool */}
            <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${colors.cardBorder}`, flexWrap: "wrap" }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a player…"
                  style={{ ...sel, flex: "1 1 180px" }}
                />
                {["ALL", ...POSITIONS].map((p) => (
                  <button key={p} onClick={() => setFilter(p)} style={chip(filter === p)}>
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ maxHeight: "64vh", overflowY: "auto" }}>
                {shown.map((p) => (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto auto", gap: 10, alignItems: "center", padding: "9px 16px", borderBottom: "1px solid rgba(49,29,0,0.06)" }}>
                    <div style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.brown60 }}>{p.rank ?? "—"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                        {p.injury && (
                          <span style={{ marginLeft: 7, fontFamily: fonts.condensed, fontSize: 10.5, color: "#C2415B", letterSpacing: 0.5 }}>
                            {p.injury.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown60, letterSpacing: 0.3 }}>
                        {[p.proTeam, p.bye ? `BYE ${p.bye}` : null, `${p.pos}${posRankOf(p)}`, p.adp ? `ADP ${p.adp}` : null, p.projected != null ? `${p.projected} proj` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span style={{ fontFamily: fonts.condensed, fontSize: 10.5, fontWeight: 700, color: "#fff", background: POS_COLOR[p.pos] ?? colors.brown60, padding: "2px 7px", borderRadius: 3 }}>
                      {p.pos}
                    </span>
                    <button onClick={() => toggleCompare(p.id)} style={chip(compare.includes(p.id))}>
                      {compare.includes(p.id) ? "✓ VS" : "+ VS"}
                    </button>
                  </div>
                ))}
                {shown.length === 0 && <div style={{ padding: 24, textAlign: "center", color: colors.brown60 }}>Nobody matches that.</div>}
              </div>
            </div>

            {/* right rail */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card title="Compare" action={compare.length ? <button onClick={() => setCompare([])} style={chip(false)}>Clear</button> : null}>
                {compared.length === 0 ? (
                  <div style={{ fontSize: 13.5, color: colors.brown70 }}>Hit <strong>+ VS</strong> on two players to stack them side by side.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                      <tbody>
                        <CmpRow label="" cells={compared.map((p) => <strong key={p.id}>{p.name}</strong>)} />
                        <CmpRow label="Pos" cells={compared.map((p) => `${p.pos}${posRankOf(p)}`)} />
                        <CmpRow label="Rank" cells={compared.map((p) => `#${p.rank ?? "—"}`)} />
                        <CmpRow label="ADP" cells={compared.map((p) => p.adp ?? "—")} />
                        <CmpRow label="Projected" cells={compared.map((p) => p.projected ?? "—")} />
                        <CmpRow label="Bye" cells={compared.map((p) => p.bye ?? "—")} />
                        <CmpRow label="Rostered" cells={compared.map((p) => (p.percentOwned != null ? `${p.percentOwned}%` : "—"))} />
                        <CmpRow label="Status" cells={compared.map((p) => p.injury ? p.injury.replace(/_/g, " ") : "OK")} />
                        <CmpRow
                          label="Fills"
                          cells={compared.map((p) =>
                            (needs[p.pos] || 0) > 0 ? "Starter" : FLEX_OK.includes(p.pos) && (needs.FLEX || 0) > 0 ? "FLEX" : "Bench",
                          )}
                        />
                        <CmpRow
                          label="There next turn?"
                          cells={compared.map((p) => {
                            if (!gap) return "you're up";
                            const idx = available.findIndex((a) => a.id === p.id);
                            return idx >= 0 && idx < gap ? "Unlikely" : "Probably";
                          })}
                        />
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title={myTeam ? `Your roster · ${myTeam.name}` : "Your roster"}>
                {myTeamId == null ? (
                  <div style={{ fontSize: 13.5, color: colors.brown70 }}>Pick your team up top to track your roster.</div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {(board.lineup ?? []).map((s) => {
                        const n = needs[s.pos] || 0;
                        return (
                          <span key={s.pos} style={{ fontFamily: fonts.condensed, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: "4px 8px", borderRadius: 3, border: `1px solid ${n ? colors.orange : colors.cardBorder}`, color: n ? colors.orange : colors.brown60 }}>
                            {s.pos}{n ? ` ×${n}` : " ✓"}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {roster.filled.map((s, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 10, alignItems: "center", padding: "7px 10px", background: "#f8f4ea", borderRadius: 4, borderLeft: `2px solid ${s.player ? colors.cardBorder : colors.orange}` }}>
                          <span style={{ fontFamily: fonts.condensed, fontSize: 11, color: colors.brown70, letterSpacing: 0.6 }}>{s.label}</span>
                          <span style={{ fontSize: 13.5, color: s.player ? colors.brown : colors.brown60, fontStyle: s.player ? "normal" : "italic" }}>
                            {s.player ? s.player.name : "open"}
                          </span>
                        </div>
                      ))}
                      {roster.bench.map((p) => (
                        <div key={p.id} style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 10, alignItems: "center", padding: "6px 10px" }}>
                          <span style={{ fontFamily: fonts.condensed, fontSize: 11, color: colors.brown60, letterSpacing: 0.6 }}>BE</span>
                          <span style={{ fontSize: 13.5 }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card title="Pick log">
                {madeCount === 0 ? (
                  <div style={{ fontSize: 13.5, color: colors.brown70 }}>No picks yet.</div>
                ) : (
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {board.picks.slice().reverse().slice(0, 60).map((pk) => {
                      const pl = board.players.find((p) => p.id === pk.playerId);
                      const tm = board.teams.find((t) => t.id === pk.teamId);
                      return (
                        <div key={pk.overall} style={{ display: "grid", gridTemplateColumns: "50px 1fr auto", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(49,29,0,0.06)", fontSize: 13 }}>
                          <span style={{ fontFamily: fonts.condensed, fontSize: 11.5, color: colors.brown60 }}>
                            {pk.round}.{String(pk.roundPick).padStart(2, "0")}
                          </span>
                          <span>{pl?.name ?? `Player ${pk.playerId}`}</span>
                          <span style={{ fontFamily: fonts.condensed, fontSize: 11, color: pk.teamId === myTeamId ? colors.orange : colors.brown60, textAlign: "right" }}>
                            {tm?.name ?? ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div style={{ marginTop: 18, fontFamily: fonts.condensed, fontSize: 12, color: colors.brown60, letterSpacing: 0.3 }}>
            {board.scoring} scoring · {available.length} players available · {madeCount} picks in · order {orderSource === "manual" ? "set by you" : orderSource === "espn" ? "from ESPN" : "not set"}
            {fetchedAt ? ` · updated ${fetchedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : ""}
          </div>
        </>
      )}
    </>
  );
}

/* ---------- small pieces ---------- */

const lab: React.CSSProperties = {
  fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 1.6,
  color: colors.orange, fontWeight: 700, marginBottom: 4,
};
const sel: React.CSSProperties = {
  fontSize: 14, padding: "8px 11px", borderRadius: 4,
  border: `1px solid ${colors.cardBorder}`, background: "#fff", color: colors.brown,
  fontFamily: fonts.body, outline: "none",
};
function btn(on: boolean): React.CSSProperties {
  return {
    background: on ? colors.orange : "#fff", color: on ? "#fff" : colors.brown80,
    border: `1px solid ${on ? colors.orange : colors.cardBorder}`, borderRadius: 4,
    padding: "8px 13px", fontFamily: fonts.condensed, fontWeight: 700,
    fontSize: 12, letterSpacing: 0.6, cursor: "pointer",
  };
}
function chip(on: boolean): React.CSSProperties {
  return {
    background: on ? colors.brown : "transparent", color: on ? colors.cream : colors.brown70,
    border: `1px solid ${on ? colors.brown : colors.cardBorder}`, borderRadius: 4,
    padding: "6px 10px", fontFamily: fonts.condensed, fontWeight: 700,
    fontSize: 11, letterSpacing: 0.5, cursor: "pointer",
  };
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${colors.cardBorder}` }}>
        <span style={{ fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 1.3, fontWeight: 700, color: colors.brown90, textTransform: "uppercase" }}>
          {title}
        </span>
        {action}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function CmpRow({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr>
      <th style={{ textAlign: "left", padding: "7px 8px 7px 0", fontFamily: fonts.condensed, fontSize: 10.5, letterSpacing: 0.9, textTransform: "uppercase", color: colors.brown60, fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid rgba(49,29,0,0.06)" }}>
        {label}
      </th>
      {cells.map((c, i) => (
        <td key={i} style={{ padding: "7px 8px", borderBottom: "1px solid rgba(49,29,0,0.06)", fontVariantNumeric: "tabular-nums" }}>
          {c}
        </td>
      ))}
    </tr>
  );
}

function Banner({ tone = "muted", children }: { tone?: "warn" | "muted"; children: React.ReactNode }) {
  const s: React.CSSProperties =
    tone === "warn"
      ? { background: "#fff8f0", color: colors.brown, border: "1px solid rgba(251,79,20,0.3)" }
      : { background: colors.white, color: colors.brown80, border: `1px solid ${colors.cardBorder}` };
  return (
    <div style={{ ...s, borderRadius: 6, padding: "10px 16px", fontSize: 13.5, marginBottom: 16, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}
