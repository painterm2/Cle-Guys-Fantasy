"use client";

import { useEffect, useState } from "react";

// Map of team name (lowercased) -> ESPN logo URL, pulled from the standings
// API (which already fetches mTeam). Empty until ESPN responds; Avatar falls
// back to initials, so pages work fine without it.
export function useTeamLogos(): Record<string, string> {
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/standings");
        const json = await r.json();
        if (!alive || json.status !== "live") return;
        const map: Record<string, string> = {};
        for (const t of json.data ?? []) {
          if (t.logo) map[String(t.name).toLowerCase()] = t.logo;
        }
        setLogos(map);
      } catch {
        /* logos are decoration — initials fallback covers it */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return logos;
}

export const logoFor = (logos: Record<string, string>, name: string): string | null =>
  logos[name.toLowerCase()] ?? null;
