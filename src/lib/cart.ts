"use client";

import { useCallback, useEffect, useState } from "react";
import { storeProducts, type StoreProduct } from "./leagueData";

// ---------------------------------------------------------------------------
// Store cart. Everything here stays in the browser — cart contents AND the
// shipping details entered at checkout. There is no server order: the buyer
// screenshots the receipt and sends it to the commish, who places the real
// Printful order. That keeps home addresses off the (public) shared store.
// ---------------------------------------------------------------------------

export interface CartLine {
  key: string; // product id + size + color, so variants stack separately
  productId: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  qty: number;
}

export interface ShipTo {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  notes: string;
}

export const EMPTY_SHIP: ShipTo = { name: "", line1: "", line2: "", city: "", state: "", zip: "", phone: "", notes: "" };

const CART_KEY = "cg-cart";

export const lineKey = (productId: string, size?: string, color?: string) =>
  [productId, size ?? "", color ?? ""].join("|");

export const money = (n: number) => `$${n.toFixed(2)}`;

export function productById(id: string): StoreProduct | undefined {
  return storeProducts.find((p) => p.id === id);
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore a corrupt cart */
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      /* private mode — cart just won't survive a refresh */
    }
  }, []);

  const add = useCallback(
    (product: StoreProduct, size: string | undefined, color: string | undefined, qty: number) => {
      const key = lineKey(product.id, size, color);
      setLines((cur) => {
        const existing = cur.find((l) => l.key === key);
        const next = existing
          ? cur.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
          : [...cur, { key, productId: product.id, name: product.name, price: product.price, size, color, qty }];
        try {
          localStorage.setItem(CART_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      persist(qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty } : l)));
    },
    [lines, persist],
  );

  const remove = useCallback((key: string) => persist(lines.filter((l) => l.key !== key)), [lines, persist]);
  const clear = useCallback(() => persist([]), [persist]);

  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);

  return { lines, loaded, add, setQty, remove, clear, count, subtotal };
}

/** Short human-friendly order id, e.g. CG-7K3QP. */
export function makeOrderId(): string {
  return `CG-${Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5)}`;
}

/** Plain-text version of the order, for the "copy" fallback. */
export function orderText(orderId: string, lines: CartLine[], ship: ShipTo, subtotal: number): string {
  const items = lines
    .map((l) => `  ${l.qty}x ${l.name}${l.size ? ` / ${l.size}` : ""}${l.color ? ` / ${l.color}` : ""} — ${money(l.qty * l.price)}`)
    .join("\n");
  const addr = [ship.line1, ship.line2, `${ship.city}, ${ship.state} ${ship.zip}`].filter(Boolean).join("\n  ");
  return [
    `CLEVELAND GUYS ORDER ${orderId}`,
    ``,
    `Ordered by: ${ship.name}`,
    ``,
    `ITEMS`,
    items,
    ``,
    `Subtotal: ${money(subtotal)} (shipping + tax added to the Venmo request)`,
    ``,
    `SHIP TO`,
    `  ${ship.name}`,
    `  ${addr}`,
    ship.phone ? `  ${ship.phone}` : "",
    ship.notes ? `\nNOTES\n  ${ship.notes}` : "",
  ]
    .filter((s) => s !== "")
    .join("\n");
}
