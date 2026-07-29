import { colors, fonts } from "@/lib/theme";
import { PageTitle, EmptyState } from "@/components/ui";
import { storeProducts, type StoreProduct } from "@/lib/leagueData";

export default function StorePage() {
  const live = storeProducts.filter((p) => p.name && p.url);

  return (
    <>
      <PageTitle sub="League merch, printed and shipped by Printful. Wear it with whatever dignity you have left.">
        LEAGUE STORE
      </PageTitle>

      {live.length === 0 ? (
        <EmptyState>Merch is on the way — product links get added here once the designs are up.</EmptyState>
      ) : (
        <div className="cg-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {live.map((p) => (
            <ProductCard key={p.url} product={p} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: colors.white,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 6,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: colors.brown,
      }}
    >
      <div style={{ aspectRatio: "1/1", background: "#f2ede0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ fontFamily: fonts.condensed, fontSize: 13, color: colors.brown60, letterSpacing: 1 }}>
            PRODUCT PHOTO
          </div>
        )}
      </div>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5 }}>{product.name}</div>
        {product.blurb && <div style={{ fontSize: 13.5, color: colors.brown80, lineHeight: 1.45, flex: 1 }}>{product.blurb}</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
          {product.price && (
            <div style={{ fontFamily: fonts.display, fontSize: 19, color: colors.brown }}>{product.price}</div>
          )}
          <span
            style={{
              background: colors.orange,
              color: "#fff",
              fontFamily: fonts.condensed,
              fontWeight: 600,
              letterSpacing: 0.5,
              fontSize: 13,
              padding: "8px 14px",
              borderRadius: 4,
              marginLeft: "auto",
            }}
          >
            BUY ↗
          </span>
        </div>
      </div>
    </a>
  );
}
