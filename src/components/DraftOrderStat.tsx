"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui";
import type { DraftOrderData } from "@/lib/espn";

/**
 * Home-page tile for the draft order. Starts on the "TBD" copy and swaps to
 * the real first pick once ESPN tells us the order is set.
 */
export function DraftOrderStat() {
  const [tile, setTile] = useState<{ value: string; sub: string }>({
    value: "TBD",
    sub: "revealed before draft day",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/draft");
        const json = (await r.json()) as { status: string; data: DraftOrderData };
        if (!alive || json.status !== "live") return;
        const first = json.data?.order?.[0];
        if (!first) return;
        setTile({
          value: json.data.drafted ? "DRAFTED" : "SET",
          sub: `1.01 — ${first.owner ?? first.team}`,
        });
      } catch {
        // Leave the default copy in place.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <StatCard label="DRAFT ORDER" value={tile.value} sub={tile.sub} />;
}
