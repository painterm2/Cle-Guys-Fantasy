import { CSSProperties, ReactNode } from "react";
import { colors, fonts } from "@/lib/theme";

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ marginBottom: sub ? 20 : 24 }}>
      <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: 0, fontWeight: 400 }}>{children}</h1>
      {sub && <div style={{ fontSize: 15, color: colors.brown80, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function SectionLabel({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: fonts.condensed,
        fontSize: 13,
        letterSpacing: 2,
        color: color ?? colors.brown90,
        fontWeight: 700,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

/** A neutral "nothing here yet" placeholder for sections waiting to be filled in. */
export function EmptyState({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.white,
        border: "2px dashed rgba(49,29,0,0.2)",
        borderRadius: 6,
        padding: "26px 24px",
        textAlign: "center",
        fontSize: 14.5,
        color: colors.brown60,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 6,
        padding: "22px 26px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
