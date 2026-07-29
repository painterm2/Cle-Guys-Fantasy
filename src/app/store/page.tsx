"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import { PageTitle, SectionLabel, EmptyState } from "@/components/ui";
import { storeProducts, COMMISH_CONTACT, type StoreProduct } from "@/lib/leagueData";
import { useCart, money, makeOrderId, orderText, EMPTY_SHIP, type CartLine, type ShipTo } from "@/lib/cart";

type Step = "shop" | "checkout" | "receipt";

interface PlacedOrder {
  id: string;
  lines: CartLine[];
  ship: ShipTo;
  subtotal: number;
  at: string;
}

export default function StorePage() {
  const cart = useCart();
  const [step, setStep] = useState<Step>("shop");
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  const live = storeProducts.filter((p) => p.name);

  const placeOrder = (ship: ShipTo) => {
    setOrder({ id: makeOrderId(), lines: cart.lines, ship, subtotal: cart.subtotal, at: new Date().toISOString() });
    cart.clear();
    setStep("receipt");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (step === "receipt" && order) {
    return <Receipt order={order} onDone={() => setStep("shop")} />;
  }

  if (step === "checkout") {
    return (
      <CheckoutForm
        lines={cart.lines}
        subtotal={cart.subtotal}
        onBack={() => setStep("shop")}
        onSubmit={placeOrder}
      />
    );
  }

  return (
    <>
      <PageTitle sub="League merch, printed by Printful. Add what you want, check out, then send the commish your order screenshot — he places the order and Venmo requests you.">
        LEAGUE STORE
      </PageTitle>

      {live.length === 0 ? (
        <EmptyState>Merch is on the way — products get added here once the designs are locked in.</EmptyState>
      ) : (
        <div className="cg-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 28 }}>
          {live.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={cart.add} />
          ))}
        </div>
      )}

      {cart.lines.length > 0 && (
        <>
          <SectionLabel>YOUR CART</SectionLabel>
          <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "18px 24px" }}>
            {cart.lines.map((l) => (
              <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid rgba(49,29,0,0.07)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{l.name}</div>
                  <div style={{ fontFamily: fonts.condensed, fontSize: 12.5, color: colors.brown70, letterSpacing: 0.3 }}>
                    {[l.size, l.color].filter(Boolean).join(" · ") || "One size"} · {money(l.price)} each
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                  <QtyButton label="−" onClick={() => cart.setQty(l.key, l.qty - 1)} />
                  <div style={{ fontFamily: fonts.display, fontSize: 16, minWidth: 26, textAlign: "center" }}>{l.qty}</div>
                  <QtyButton label="+" onClick={() => cart.setQty(l.key, l.qty + 1)} />
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: 17, width: 74, textAlign: "right", flex: "none" }}>
                  {money(l.qty * l.price)}
                </div>
                <button
                  onClick={() => cart.remove(l.key)}
                  title="Remove"
                  style={{ background: "none", border: "none", color: colors.orange, cursor: "pointer", fontSize: 16, flex: "none" }}
                >
                  ×
                </button>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 14, borderTop: `2px solid ${colors.orange}`, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: fonts.condensed, fontSize: 12, letterSpacing: 1.5, color: colors.brown90, fontWeight: 700 }}>
                  SUBTOTAL ({cart.count} {cart.count === 1 ? "item" : "items"})
                </div>
                <div style={{ fontSize: 12.5, color: colors.brown70 }}>Shipping &amp; tax get added to the Venmo request.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontFamily: fonts.display, fontSize: 26 }}>{money(cart.subtotal)}</div>
                <button
                  onClick={() => {
                    setStep("checkout");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{ background: colors.orange, color: "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 14, letterSpacing: 0.5, padding: "12px 22px", borderRadius: 4, cursor: "pointer" }}
                >
                  CHECKOUT →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function QtyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${colors.cardBorder}`, background: "#fff", color: colors.brown, fontSize: 15, lineHeight: 1, cursor: "pointer", fontWeight: 700 }}
    >
      {label}
    </button>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: StoreProduct;
  onAdd: (p: StoreProduct, size: string | undefined, color: string | undefined, qty: number) => void;
}) {
  const [size, setSize] = useState(product.sizes?.[0] ?? "");
  const [color, setColor] = useState(product.colors?.[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [shot, setShot] = useState(0);
  // Drop any image that fails to load so a missing file shows the placeholder
  // rather than a broken-image icon.
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const images = (product.images ?? []).filter((src) => src && !broken[src]);

  const add = () => {
    onAdd(product, product.sizes ? size : undefined, product.colors ? color : undefined, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const select: React.CSSProperties = {
    fontSize: 13.5,
    padding: "7px 10px",
    borderRadius: 4,
    border: `1px solid ${colors.cardBorder}`,
    fontFamily: fonts.body,
    background: "#fff",
    color: colors.brown,
    cursor: "pointer",
    flex: 1,
    minWidth: 0,
  };

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ aspectRatio: "1/1", background: "#f2ede0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        {images.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[Math.min(shot, images.length - 1)]}
              alt={product.name}
              onError={(e) => setBroken((b) => ({ ...b, [(e.target as HTMLImageElement).getAttribute("src") ?? ""]: true }))}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {images.length > 1 && (
              <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setShot(i)}
                    aria-label={i === 0 ? "Front" : "Back"}
                    style={{
                      width: 26,
                      height: 6,
                      borderRadius: 3,
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      background: i === shot ? colors.orange : "rgba(49,29,0,0.25)",
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.brown60, letterSpacing: 1 }}>PRODUCT PHOTO</div>
        )}
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{product.name}</div>
          {product.blurb && <div style={{ fontSize: 13.5, color: colors.brown80, lineHeight: 1.45, marginTop: 3 }}>{product.blurb}</div>}
        </div>

        <div style={{ fontFamily: fonts.display, fontSize: 21, marginTop: "auto" }}>{money(product.price)}</div>

        <div style={{ display: "flex", gap: 8 }}>
          {product.sizes && (
            <select value={size} onChange={(e) => setSize(e.target.value)} style={select} aria-label="Size">
              {product.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {product.colors && (
            <select value={color} onChange={(e) => setColor(e.target.value)} style={select} aria-label="Color">
              {product.colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <select value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ ...select, flex: "none", width: 62 }} aria-label="Quantity">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          onClick={add}
          style={{ background: added ? colors.brown : colors.orange, color: added ? colors.cream : "#fff", border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "10px 14px", borderRadius: 4, cursor: "pointer" }}
        >
          {added ? "✓ ADDED" : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}

function CheckoutForm({
  lines,
  subtotal,
  onBack,
  onSubmit,
}: {
  lines: CartLine[];
  subtotal: number;
  onBack: () => void;
  onSubmit: (ship: ShipTo) => void;
}) {
  const [ship, setShip] = useState<ShipTo>(EMPTY_SHIP);
  const set = (k: keyof ShipTo, v: string) => setShip({ ...ship, [k]: v });

  const valid = ship.name.trim() && ship.line1.trim() && ship.city.trim() && ship.state.trim() && ship.zip.trim();

  const input = (extra?: React.CSSProperties): React.CSSProperties => ({
    fontSize: 14,
    padding: "10px 12px",
    borderRadius: 4,
    border: `1px solid ${colors.cardBorder}`,
    outline: "none",
    fontFamily: fonts.body,
    width: "100%",
    boxSizing: "border-box",
    ...extra,
  });

  return (
    <>
      <PageTitle sub="Where should it ship? This stays on your device — it only shows up in the screenshot you send the commish.">
        CHECKOUT
      </PageTitle>

      <div className="cg-split" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px" }}>
          <SectionLabel color={colors.orange}>SHIPPING DETAILS</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={ship.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name *" style={input()} />
            <input value={ship.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Street address *" style={input()} />
            <input value={ship.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Apt, suite, etc. (optional)" style={input()} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={ship.city} onChange={(e) => set("city", e.target.value)} placeholder="City *" style={input({ flex: 2, minWidth: 130 })} />
              <input value={ship.state} onChange={(e) => set("state", e.target.value)} placeholder="State *" style={input({ flex: 1, minWidth: 70 })} />
              <input value={ship.zip} onChange={(e) => set("zip", e.target.value)} placeholder="ZIP *" style={input({ flex: 1, minWidth: 80 })} />
            </div>
            <input value={ship.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone (optional — helps with delivery issues)" style={input()} />
            <textarea
              value={ship.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything else the commish should know?"
              rows={3}
              style={input({ resize: "vertical" })}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button
              onClick={onBack}
              style={{ background: "none", border: `1px solid ${colors.cardBorder}`, color: colors.brown80, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "11px 18px", borderRadius: 4, cursor: "pointer" }}
            >
              ← BACK TO STORE
            </button>
            <button
              onClick={() => valid && onSubmit(ship)}
              disabled={!valid}
              style={{
                background: valid ? colors.orange : "#e6ddcb",
                color: valid ? "#fff" : colors.brown60,
                border: "none",
                fontFamily: fonts.condensed,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: 0.5,
                padding: "11px 22px",
                borderRadius: 4,
                cursor: valid ? "pointer" : "default",
              }}
            >
              PLACE ORDER →
            </button>
          </div>
          {!valid && (
            <div style={{ fontSize: 12.5, color: colors.brown70, marginTop: 10, fontFamily: fonts.condensed }}>
              Fill in the starred fields to continue.
            </div>
          )}
        </div>

        <div style={{ background: colors.white, border: `1px solid ${colors.cardBorder}`, borderRadius: 6, padding: "22px 26px" }}>
          <SectionLabel>ORDER SUMMARY</SectionLabel>
          {lines.map((l) => (
            <div key={l.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(49,29,0,0.07)", fontSize: 14 }}>
              <div>
                {l.qty}× {l.name}
                <div style={{ fontFamily: fonts.condensed, fontSize: 12, color: colors.brown70 }}>
                  {[l.size, l.color].filter(Boolean).join(" · ") || "One size"}
                </div>
              </div>
              <div style={{ flex: "none", fontWeight: 600 }}>{money(l.qty * l.price)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `2px solid ${colors.orange}`, alignItems: "baseline" }}>
            <div style={{ fontFamily: fonts.condensed, fontSize: 12.5, letterSpacing: 1.2, fontWeight: 700 }}>SUBTOTAL</div>
            <div style={{ fontFamily: fonts.display, fontSize: 24 }}>{money(subtotal)}</div>
          </div>
          <div style={{ fontSize: 12.5, color: colors.brown70, marginTop: 8, lineHeight: 1.45 }}>
            Shipping and tax aren&apos;t included — the commish adds them to the Venmo request once the real order is placed.
          </div>
        </div>
      </div>
    </>
  );
}

function Receipt({ order, onDone }: { order: PlacedOrder; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderText(order.id, order.lines, order.ship, order.subtotal));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the screenshot is the primary path anyway */
    }
  };

  return (
    <>
      {/* Big instruction — the whole point of this screen */}
      <div style={{ background: colors.orange, borderRadius: 6, padding: "22px 26px", marginBottom: 18, color: "#fff" }}>
        <div style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 1.1, marginBottom: 6 }}>
          📸 SEND THIS SCREENSHOT TO {COMMISH_CONTACT.toUpperCase()}
        </div>
        <div style={{ fontSize: 14.5, opacity: 0.95, lineHeight: 1.45 }}>
          Screenshot this whole page and text it over. He&apos;ll place the Printful order and Venmo request you for the
          total plus shipping. Nothing was charged here.
        </div>
      </div>

      {/* The receipt itself — self-contained so one screenshot catches everything */}
      <div style={{ background: colors.white, border: `2px solid ${colors.brown}`, borderRadius: 6, padding: "24px 28px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", borderBottom: `2px solid ${colors.orange}`, paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.5 }}>CLEVELAND GUYS ORDER</div>
            <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 1.5, color: colors.brown70 }}>
              {new Date(order.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 26, color: colors.orange }}>{order.id}</div>
        </div>

        <SectionLabel>ITEMS</SectionLabel>
        {order.lines.map((l) => (
          <div key={l.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: "1px solid rgba(49,29,0,0.07)", fontSize: 14.5 }}>
            <div>
              <strong>{l.qty}× {l.name}</strong>
              <div style={{ fontFamily: fonts.condensed, fontSize: 12.5, color: colors.brown70, letterSpacing: 0.3 }}>
                {[l.size && `Size ${l.size}`, l.color].filter(Boolean).join(" · ") || "One size"} · {money(l.price)} each
              </div>
            </div>
            <div style={{ flex: "none", fontWeight: 700 }}>{money(l.qty * l.price)}</div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14, paddingTop: 12, borderTop: `2px solid ${colors.orange}` }}>
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, letterSpacing: 1.2, fontWeight: 700 }}>SUBTOTAL</div>
          <div style={{ fontFamily: fonts.display, fontSize: 26 }}>{money(order.subtotal)}</div>
        </div>
        <div style={{ fontSize: 12.5, color: colors.brown70, marginTop: 4, marginBottom: 18 }}>
          + shipping &amp; tax, added to the Venmo request.
        </div>

        <SectionLabel>SHIP TO</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>
          <strong>{order.ship.name}</strong>
          <br />
          {order.ship.line1}
          {order.ship.line2 && (
            <>
              <br />
              {order.ship.line2}
            </>
          )}
          <br />
          {order.ship.city}, {order.ship.state} {order.ship.zip}
          {order.ship.phone && (
            <>
              <br />
              {order.ship.phone}
            </>
          )}
        </div>

        {order.ship.notes && (
          <div style={{ marginTop: 14 }}>
            <SectionLabel>NOTES</SectionLabel>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{order.ship.notes}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={copy}
          style={{ background: colors.brown, color: colors.cream, border: "none", fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, letterSpacing: 0.5, padding: "11px 20px", borderRadius: 4, cursor: "pointer" }}
        >
          {copied ? "✓ COPIED" : "COPY AS TEXT"}
        </button>
        <button
          onClick={onDone}
          style={{ background: "none", border: `1px solid ${colors.cardBorder}`, color: colors.brown80, fontFamily: fonts.condensed, fontWeight: 600, fontSize: 13.5, padding: "11px 20px", borderRadius: 4, cursor: "pointer" }}
        >
          BACK TO STORE
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: colors.brown70, marginTop: 10, fontFamily: fonts.condensed, letterSpacing: 0.3 }}>
        Can&apos;t screenshot? Hit COPY AS TEXT and paste it to the commish instead.
      </div>
    </>
  );
}
