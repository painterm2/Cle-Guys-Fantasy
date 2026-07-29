"use client";

import { useEffect, useRef, useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { useCommish } from "./CommishProvider";

interface ProofItem {
  url: string;
  pathname: string;
  week: number;
  uploadedAt: string;
}

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

// Downscale big phone photos before upload so the shared store stays light.
async function resizeImage(file: File, maxDim = 1400, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function PunishmentProof({ who = "the loser" }: { who?: string }) {
  const { commish } = useCommish();
  const [items, setItems] = useState<ProofItem[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [week, setWeek] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/punishment-proof");
      const json = await r.json();
      setConfigured(json.configured !== false);
      setItems(json.items ?? []);
    } catch {
      setError("Couldn't load the proof wall.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const resized = await resizeImage(file);
      const fd = new FormData();
      fd.append("file", resized);
      const r = await fetch(`/api/punishment-proof?week=${week}`, { method: "POST", body: fd });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Upload failed (${r.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (url: string) => {
    if (!confirm("Delete this photo for everyone?")) return;
    await fetch(`/api/punishment-proof?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    await load();
  };

  const byWeek = items.reduce<Record<number, ProofItem[]>>((acc, it) => {
    (acc[it.week] ??= []).push(it);
    return acc;
  }, {});
  const weeksWithPics = Object.keys(byWeek).map(Number).sort((a, b) => b - a);

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "20px 24px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 2, color: colors.orange, fontWeight: 700 }}>
          📸 PROOF OF PUNISHMENT — {who.toUpperCase()}
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: colors.brown80, marginBottom: 16, lineHeight: 1.4 }}>
        Weekly photo evidence that the punishment is being served. Everyone in the league sees the wall of shame here.
      </div>

      {/* Uploader */}
      {configured ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: error ? 8 : 18 }}>
          <label style={{ fontFamily: fonts.condensed, fontSize: 12.5, fontWeight: 600, color: colors.brown80, letterSpacing: 0.5 }}>
            WEEK{" "}
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              style={{ fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13, padding: "6px 10px", borderRadius: 4, border: `1px solid ${colors.cardBorder}`, background: "#fff", color: colors.brown, cursor: "pointer" }}
            >
              {WEEKS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "9px 18px", borderRadius: 4, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "UPLOADING…" : "+ UPLOAD PHOTO"}
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff8f0", border: "1px solid rgba(251,79,20,0.3)", borderRadius: 6, padding: "12px 16px", fontSize: 13.5, color: colors.brown, marginBottom: 18, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
          Photo uploads need a <strong>Vercel Blob store</strong> connected (a 1-minute toggle in your Vercel project). See the README →
          &ldquo;Punishment photo wall&rdquo;.
        </div>
      )}

      {error && <div style={{ color: colors.orange, fontSize: 13, marginBottom: 14, fontFamily: fonts.condensed }}>{error}</div>}

      {/* Gallery */}
      {!loaded ? (
        <div style={{ fontSize: 13.5, color: colors.brown70 }}>Loading the wall…</div>
      ) : weeksWithPics.length === 0 ? (
        <div style={{ border: "2px dashed rgba(49,29,0,0.2)", borderRadius: 6, padding: 22, textAlign: "center", fontSize: 13.5, color: colors.brown60 }}>
          No photos yet — {who} better get posting.
        </div>
      ) : (
        weeksWithPics.map((w) => (
          <div key={w} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, fontWeight: 700, color: colors.brown90, marginBottom: 8 }}>WEEK {w}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {byWeek[w].map((it) => (
                <div key={it.pathname} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 6, overflow: "hidden", border: `1px solid ${colors.cardBorder}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <a href={it.url} target="_blank" rel="noopener noreferrer">
                    <img src={it.url} alt={`${who} week ${w}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </a>
                  {commish && (
                    <button
                      onClick={() => remove(it.url)}
                      title="Delete (commish)"
                      style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(49,29,0,0.75)", color: "#fff", fontSize: 13, lineHeight: 1, cursor: "pointer" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
