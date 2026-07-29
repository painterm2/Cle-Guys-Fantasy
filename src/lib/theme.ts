// Design tokens — Cleveland Browns palette from the design handoff.
export const colors = {
  cream: "#f5efe4",
  brown: "#311D00",
  orange: "#FB4F14",
  orangeHover: "#e0430c",
  white: "#ffffff",
  cardBorder: "rgba(49,29,0,0.1)",
  // Common brown-with-alpha tints used throughout the design
  brown90: "#311d0090",
  brown80: "#311d0080",
  brown70: "#311d0070",
  brown60: "#311d0060",
  brown55: "#311D0055",
  creamMuted: "#f5efe4b0",
} as const;

export const fonts = {
  display: "'Anton', sans-serif",
  condensed: "'Barlow Condensed', sans-serif",
  body: "'Barlow', sans-serif",
} as const;

// Avatar palette used for team badges when a real ESPN logo isn't available.
export const AVATAR_COLORS = [
  "#FB4F14",
  "#311D00",
  "#8a5a2c",
  "#c96f1e",
  "#5b3a1e",
  "#a13d10",
  "#7a4a1a",
  "#d97f2a",
  "#4a2e10",
  "#e08b3a",
];
