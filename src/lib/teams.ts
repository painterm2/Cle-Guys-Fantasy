import { AVATAR_COLORS } from "./theme";

// Real league team names, in ESPN standings order (see design handoff + screenshot).
export const TEAMS = [
  "HUGE Football Team Guy",
  "Sherwin Williams",
  "THE BEST MAN",
  "Tito .",
  "Kyle Krueger",
  "Herbie: Fully (un)Loaded",
  "Nash over Ernie",
  "The Rice Cookers",
  "Michael Painter: The Movie",
  "Maker Bae-field",
];

// Derive up-to-two-letter initials from a team name (mirrors the design's helper).
export function initialsOf(name: string): string {
  return (
    name
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "FF"
  );
}

export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
