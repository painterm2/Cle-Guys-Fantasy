import { NextResponse } from "next/server";
import { diagnoseDraft } from "@/lib/espn";

export const dynamic = "force-dynamic";

// What ESPN is actually returning for the draft, per host. Counts and flags
// only — no cookies, no player detail — so it's safe to open in a browser and
// paste the result when the board looks wrong.
export async function GET() {
  return NextResponse.json(await diagnoseDraft(), { headers: { "Cache-Control": "no-store" } });
}
