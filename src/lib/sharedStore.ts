"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Client side of the shared JSON store (/api/store/<key>). Everyone in the
// league reads and writes the same document, so edits made on the site stick
// for the whole league — not just the browser that made them.
//
// If the Vercel Blob store isn't connected yet, we quietly fall back to
// localStorage so the site still works (edits are just per-browser until the
// store is set up).
// ---------------------------------------------------------------------------

export type StoreKey = "polls" | "trade-boards" | "vacation" | "feed" | "parlay";

async function fetchStore<T>(key: StoreKey): Promise<{ configured: boolean; data: T | null }> {
  const r = await fetch(`/api/store/${key}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`store read failed (${r.status})`);
  return r.json();
}

async function putStore<T>(key: StoreKey, data: T): Promise<void> {
  const r = await fetch(`/api/store/${key}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `store write failed (${r.status})`);
  }
}

const localKey = (key: StoreKey) => `cg-store-${key}`;

export function useSharedStore<T>(key: StoreKey, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const [shared, setShared] = useState(false); // true once blob-backed
  const [error, setError] = useState<string | null>(null);
  const sharedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { configured, data: remote } = await fetchStore<T>(key);
        if (!alive) return;
        if (configured) {
          sharedRef.current = true;
          setShared(true);
          if (remote != null) setData(remote);
        } else {
          const cached = localStorage.getItem(localKey(key));
          if (cached) try { setData(JSON.parse(cached)); } catch {}
        }
      } catch {
        if (!alive) return;
        const cached = localStorage.getItem(localKey(key));
        if (cached) try { setData(JSON.parse(cached)); } catch {}
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  /**
   * Re-read the latest shared document, apply `fn`, save, and update local
   * state. Read-before-write keeps two people's edits from stomping on each
   * other (e.g. simultaneous votes) in all but the tightest races.
   */
  const mutate = useCallback(
    async (fn: (current: T) => T) => {
      setError(null);
      if (!sharedRef.current) {
        setData((prev) => {
          const next = fn(prev);
          try { localStorage.setItem(localKey(key), JSON.stringify(next)); } catch {}
          return next;
        });
        return;
      }
      try {
        const { data: remote } = await fetchStore<T>(key);
        const base = remote != null ? remote : initial;
        const next = fn(base);
        setData(next); // optimistic
        await putStore(key, next);
      } catch (err: any) {
        setError(err?.message ?? "Couldn't save — try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return { data, loaded, shared, error, mutate };
}

// --- League feed -----------------------------------------------------------

export interface FeedItem {
  who: string;
  what: string;
  at: string; // ISO timestamp
  teamIndex: number | null;
}

const FEED_MAX = 30;

/** Fire-and-forget: append a line to the home-page league feed. */
export function logFeed(who: string, what: string, teamIndex: number | null = null) {
  (async () => {
    try {
      const { configured, data } = await fetchStore<FeedItem[]>("feed");
      if (!configured) return; // no shared store — skip silently
      const next: FeedItem[] = [{ who, what, at: new Date().toISOString(), teamIndex }, ...(data ?? [])].slice(0, FEED_MAX);
      await putStore("feed", next);
    } catch {
      /* the feed is a nicety — never block the real action on it */
    }
  })();
}

/** "2h ago" style label from an ISO timestamp. */
export function timeAgo(iso: string): string {
  const ms = Date.now() - +new Date(iso);
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const wk = Math.floor(day / 7);
  return `${wk} week${wk === 1 ? "" : "s"} ago`;
}
