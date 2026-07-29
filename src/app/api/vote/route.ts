import { NextRequest, NextResponse } from "next/server";
import { blobToken } from "@/lib/blob";
import { castBallot, readPolls, reveal } from "@/lib/pollStore";
import { OWNERS } from "@/lib/polls";

export const dynamic = "force-dynamic";

// Commish password — same value the UI gate uses, overridable by env.
const COMMISH_PASSWORD = process.env.COMMISH_PASSWORD?.trim() || "IAMCOMMISH";

// POST /api/vote  { pollId, owner, optionId }
// Casting happens server-side so the browser never handles the ballot map.
export async function POST(req: NextRequest) {
  if (!blobToken()) {
    return NextResponse.json({ error: "Shared saving isn't connected yet." }, { status: 501 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const { pollId, owner, optionId } = body ?? {};
  if (!pollId || !optionId) {
    return NextResponse.json({ error: "pollId and optionId are required." }, { status: 400 });
  }
  if (!OWNERS.includes(owner)) {
    return NextResponse.json({ error: "Pick which manager you are first." }, { status: 400 });
  }
  try {
    const ok = await castBallot(pollId, owner, optionId);
    if (!ok) {
      return NextResponse.json({ error: "You've already voted on this one." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "vote failed" }, { status: 500 });
  }
}

// GET /api/vote?password=... → commish-only ballot reveal.
export async function GET(req: NextRequest) {
  const password = new URL(req.url).searchParams.get("password") ?? "";
  if (password !== COMMISH_PASSWORD) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  if (!blobToken()) {
    return NextResponse.json({ error: "Shared saving isn't connected yet." }, { status: 501 });
  }
  try {
    return NextResponse.json({ ballots: reveal(await readPolls()) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "read failed" }, { status: 500 });
  }
}
