import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Tiny shared JSON store on Vercel Blob — the same store the punishment photo
// wall uses, so there is nothing extra to set up. Each allowed key maps to one
// JSON document that every visitor reads and writes. Last write wins, which is
// plenty for a 10-person league; writes re-read latest before applying a patch
// client-side to keep clobbering rare.
// ---------------------------------------------------------------------------

const ALLOWED_KEYS = new Set(["polls", "trade-boards", "vacation", "feed"]);
const MAX_BYTES = 200_000; // a JSON doc bigger than this is a bug, not content

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function pathFor(key: string): string {
  return `store/${key}.json`;
}

// GET /api/store/<key> → { configured, data } (data is null until first write).
export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  const { key } = params;
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "Unknown store key." }, { status: 404 });
  }
  if (!configured()) {
    return NextResponse.json({ configured: false, data: null });
  }
  try {
    const { blobs } = await list({ prefix: pathFor(key), limit: 1 });
    if (blobs.length === 0) {
      return NextResponse.json({ configured: true, data: null });
    }
    // Blob URLs sit behind a CDN — bust its cache so votes/edits show up
    // immediately rather than after the cache TTL.
    const res = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`blob fetch ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ configured: true, data });
  } catch (err: any) {
    return NextResponse.json({ configured: true, data: null, error: err?.message ?? "read failed" }, { status: 500 });
  }
}

// PUT /api/store/<key> with a JSON body → replaces the document for everyone.
export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  const { key } = params;
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "Unknown store key." }, { status: 404 });
  }
  if (!configured()) {
    return NextResponse.json(
      { error: "Shared saving isn't set up yet — connect a Vercel Blob store (see README)." },
      { status: 501 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const text = JSON.stringify(body);
  if (text.length > MAX_BYTES) {
    return NextResponse.json({ error: "Document too large." }, { status: 413 });
  }
  try {
    await put(pathFor(key), text, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false, // fixed path — each write overwrites the doc
      cacheControlMaxAge: 60, // blob CDN minimum; reads cache-bust anyway
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "write failed" }, { status: 500 });
  }
}
