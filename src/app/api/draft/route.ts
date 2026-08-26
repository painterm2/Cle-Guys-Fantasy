import { NextResponse } from "next/server";
import { getDraftOrder } from "@/lib/espn";

export const dynamic = "force-dynamic";

// Server-side proxy so ESPN cookies never touch the browser.
export async function GET() {
  const result = await getDraftOrder();
  return NextResponse.json(result, {
    headers: {
      // The order can change right up to draft night — keep it short.
      "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
    },
  });
}
