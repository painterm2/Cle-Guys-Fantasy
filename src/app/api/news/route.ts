import { NextResponse } from "next/server";
import { getNews } from "@/lib/espn";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getNews();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
