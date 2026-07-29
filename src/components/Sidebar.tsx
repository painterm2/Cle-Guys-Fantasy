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
  { href: "/draft", label: "Draft" },
  { href: "/trades", label: "Trade Board" },
  { href: "/votes", label: "Votes & Polls" },
  { href: "/vacation", label: "2028 Vacation" },
  { href: "/history", label: "History & HOF" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { commish, toggle } = useCommish();
  const [open, setOpen] = useState(false);

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
        <span style={{ fontFamily: fonts.display, fontSize: 17, letterSpacing: 0.3 }}>
          CLEVELAND GUYS
        </span>
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
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 8px 20px",
            borderBottom: `2px solid ${colors.orange}`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              flex: "none",
              borderRadius: "50%",
              background: colors.orange,
              border: `3px solid ${colors.cream}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.display,
              fontSize: 19,
              color: colors.brown,
            }}
          >
            CG
          </div>
          <div>
            <div style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 1.05, color: colors.cream, letterSpacing: 0.3 }}>
              CLEVELAND GUYS
            </div>
            <div style={{ fontFamily: fonts.condensed, fontSize: 11.5, letterSpacing: 1.5, color: colors.orange, fontWeight: 600 }}>
              EST. 2019 · 10 TEAMS
            </div>
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
            onClick={toggle}
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
    </>
  );
}
