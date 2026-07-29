import { initialsOf } from "@/lib/teams";

/**
 * Team badge. Shows the real ESPN logo when we have one, otherwise falls back
 * to a colored circle with the team's initials (matches the design mock).
 */
export function Avatar({
  name,
  color,
  size = 34,
  logo,
  fontSize,
}: {
  name: string;
  color: string;
  size?: number;
  logo?: string | null;
  fontSize?: number;
}) {
  const dim = { width: size, height: size, flex: "none" as const, borderRadius: "50%" };

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logo}
        alt={name}
        style={{ ...dim, objectFit: "cover", background: "#fff", border: "1px solid rgba(49,29,0,0.12)" }}
      />
    );
  }

  return (
    <div
      style={{
        ...dim,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        color: "#fff",
        fontSize: fontSize ?? Math.round(size * 0.38),
      }}
    >
      {initialsOf(name)}
    </div>
  );
}
