"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCommish } from "./CommishProvider";
import { colors, fonts } from "@/lib/theme";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/rules", label: "Rules" },
  { href: "/punishments", label: "Punishments" },
  { href: "/standings", label: "Standings" },
  { href: "/matchups", label: "Matchups" },
  { href: "/draft", label: "Draft" },
  { href: "/trades", label: "Trade Board" },
  { href: "/votes", label: "Votes & Polls" },
  { href: "/vacation", label: "Draft Vacation" },
  { href: "/history", label: "History & HOF" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { commish, enable, disable } = useCommish();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const onToggle = () => {
    if (commish) {
      disable();
    } else {
      setPw("");
      setPwError(false);
      setPwOpen(true);
    }
  };

  const submitPw = () => {
    if (enable(pw)) {
      setPwOpen(false);
      setPw("");
    } else {
      setPwError(true);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="cg-mobile-bar">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          style={{ background: "none", border: "none", color: colors.cream, fontSize: 24, cursor: "pointer", lineHeight: 1 }}
        >
          ☰
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Cleveland Guys" style={{ height: 40, display: "block" }} />
        <span style={{ width: 24 }} />
      </div>

      {open && <div className="cg-scrim" onClick={() => setOpen(false)} />}

      <div
        className="cg-sidebar"
        data-open={open}
        style={{
          width: 236,
          flex: "none",
          background: colors.brown,
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "0 4px 16px",
            borderBottom: `2px solid ${colors.orange}`,
            marginBottom: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="CG" style={{ width: 38, height: 38, borderRadius: 8, display: "block", marginBottom: 12 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Cleveland Guys" style={{ width: "88%", display: "block", margin: "0 auto" }} />
          <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 1.5, color: colors.orange, fontWeight: 600, textAlign: "center", marginTop: 8 }}>
            EST. 2019 · 10 TEAMS
          </div>
        </div>

        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                cursor: "pointer",
                padding: "11px 14px",
                borderRadius: 3,
                fontFamily: fonts.condensed,
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                background: active ? "rgba(251,79,20,0.18)" : "transparent",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  flex: "none",
                  borderRadius: "50%",
                  background: active ? colors.orange : "rgba(245,239,228,0.25)",
                }}
              />
              <span style={{ color: active ? colors.cream : "#f5efe4c0" }}>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <div
          style={{
            borderTop: "1px solid rgba(245,239,228,0.15)",
            paddingTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: fonts.condensed, fontSize: 12.5, letterSpacing: 1, color: colors.creamMuted, fontWeight: 600 }}>
            COMMISH MODE
          </div>
          <div
            role="switch"
            aria-checked={commish}
            onClick={onToggle}
            style={{
              width: 38,
              height: 20,
              borderRadius: 10,
              background: commish ? colors.orange : "rgba(245,239,228,0.2)",
              position: "relative",
              cursor: "pointer",
              flex: "none",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: colors.cream,
                position: "absolute",
                top: 2,
                left: commish ? 20 : 2,
                transition: "left .15s",
              }}
            />
          </div>
        </div>
      </div>

      {pwOpen && (
        <div
          onClick={() => setPwOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(49,29,0,0.55)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 8, padding: "26px 28px", width: 340, maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div style={{ fontFamily: fonts.display, fontSize: 22, marginBottom: 6, color: colors.brown }}>COMMISH ACCESS</div>
            <div style={{ fontSize: 13.5, color: colors.brown80, marginBottom: 16, lineHeight: 1.4 }}>
              Enter the commissioner password to unlock admin controls.
            </div>
            <input
              autoFocus
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setPwError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submitPw()}
              placeholder="Password"
              style={{
                width: "100%",
                fontSize: 15,
                padding: "10px 12px",
                borderRadius: 4,
                border: `1px solid ${pwError ? colors.orange : colors.cardBorder}`,
                outline: "none",
                fontFamily: fonts.body,
                marginBottom: pwError ? 6 : 16,
                boxSizing: "border-box",
              }}
            />
            {pwError && (
              <div style={{ color: colors.orange, fontSize: 12.5, marginBottom: 14, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
                Wrong password — try again.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPwOpen(false)}
                style={{ background: "none", border: `1px solid ${colors.cardBorder}`, color: colors.brown80, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "9px 16px", borderRadius: 4, cursor: "pointer" }}
              >
                CANCEL
              </button>
              <button
                onClick={submitPw}
                style={{ background: colors.brown, border: "none", color: colors.cream, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "9px 18px", borderRadius: 4, cursor: "pointer" }}
              >
                UNLOCK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
