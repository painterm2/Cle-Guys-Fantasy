import { NextRequest, NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";

export const dynamic = "force-dynamic";

// All punishment-proof images live under this prefix in Vercel Blob. The week
// is encoded in the path (week-N) so we need no separate database.
const PREFIX = "punishment-proof/";

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

interface ProofItem {
  url: string;
  pathname: string;
  week: number;
  uploadedAt: string;
}

// GET — list every uploaded proof (shared across all viewers).
export async function GET() {
  if (!configured()) {
    return NextResponse.json({ configured: false, items: [] as ProofItem[] });
  }
  try {
    const { blobs } = await list({ prefix: PREFIX });
    const items: ProofItem[] = blobs
      .map((b) => {
        const m = b.pathname.match(/week-(\d+)/);
        return {
          url: b.url,
          pathname: b.pathname,
          week: m ? Number(m[1]) : 0,
          uploadedAt: new Date(b.uploadedAt).toISOString(),
        };
      })
      .sort((a, b) => b.week - a.week || +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    return NextResponse.json({ configured: true, items });
  } catch (err: any) {
    return NextResponse.json({ configured: true, items: [], error: err?.message ?? "list failed" }, { status: 500 });
  }
}

// POST ?week=N — upload one image (multipart form field "file").
export async function POST(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ error: "Photo uploads aren't set up yet — connect a Vercel Blob store (see README)." }, { status: 501 });
  }
  const week = Number(new URL(req.url).searchParams.get("week")) || 0;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }
  const safe = (file.name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${PREFIX}week-${week}/${Date.now()}-${safe}`;
  const blob = await put(path, file, { access: "public", contentType: file.type });
  return NextResponse.json({ url: blob.url, pathname: blob.pathname, week });
}

// DELETE ?url=... — remove a proof (used by commish moderation).
export async function DELETE(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url." }, { status: 400 });
  await del(url);
  return NextResponse.json({ ok: true });
}
