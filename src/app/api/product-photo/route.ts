import { NextRequest, NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";
import { blobToken } from "@/lib/blob";

export const dynamic = "force-dynamic";

// Product photos for the store, uploaded by the commish from the site so the
// mockups don't have to be committed to the repo. Path encodes the product id:
//   product-photos/<productId>/<timestamp>-<name>
const PREFIX = "product-photos/";

function configured(): boolean {
  return Boolean(blobToken());
}

export interface ProductPhoto {
  url: string;
  pathname: string;
  productId: string;
  uploadedAt: string;
}

// GET → { configured, photos: { [productId]: url[] } }
export async function GET() {
  if (!configured()) {
    return NextResponse.json({ configured: false, photos: {} });
  }
  try {
    const { blobs } = await list({ prefix: PREFIX, token: blobToken() });
    const photos: Record<string, string[]> = {};
    const rows = blobs
      .map((b) => {
        const rest = b.pathname.slice(PREFIX.length);
        const productId = rest.split("/")[0] ?? "";
        return { url: b.url, productId, uploadedAt: new Date(b.uploadedAt).getTime() };
      })
      .filter((r) => r.productId)
      .sort((a, b) => a.uploadedAt - b.uploadedAt);
    for (const r of rows) (photos[r.productId] ??= []).push(r.url);
    return NextResponse.json({ configured: true, photos });
  } catch (err: any) {
    return NextResponse.json({ configured: true, photos: {}, error: err?.message ?? "list failed" }, { status: 500 });
  }
}

// POST ?productId=... — multipart form field "file"
export async function POST(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ error: "Photo uploads aren't connected yet." }, { status: 501 });
  }
  const productId = (new URL(req.url).searchParams.get("productId") ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
  if (!productId) return NextResponse.json({ error: "Missing productId." }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });

  const safe = (file.name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`${PREFIX}${productId}/${Date.now()}-${safe}`, file, {
    access: "public",
    contentType: file.type,
    token: blobToken(),
  });
  return NextResponse.json({ url: blob.url, productId });
}

// DELETE ?url=...
export async function DELETE(req: NextRequest) {
  if (!configured()) return NextResponse.json({ error: "Not connected." }, { status: 501 });
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url." }, { status: 400 });
  await del(url, { token: blobToken() });
  return NextResponse.json({ ok: true });
}
