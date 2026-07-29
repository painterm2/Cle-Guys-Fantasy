"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "@/lib/espn";

export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/news");
        const json = await r.json();
        if (alive && Array.isArray(json.data)) setItems(json.data);
      } catch {
        /* ticker is non-critical — stay silent on failure */
      }
    };
    load();
    // Refresh headlines every 5 minutes.
    const t = setInterval(load, 300_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (items.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly (-50% keyframe).
  const loop = [...items, ...items];

  return (
    <div className="cg-ticker" aria-label="NFL news ticker">
      <div className="cg-ticker-label">NFL WIRE</div>
      <div className="cg-ticker-viewport">
        <div className="cg-ticker-track">
          {loop.map((item, i) => (
            <span className="cg-ticker-item" key={i}>
              <span className="cg-ticker-sep">›</span>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.headline}
                </a>
              ) : (
                <span>{item.headline}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
