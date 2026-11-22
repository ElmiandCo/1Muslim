import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { searchDirectory } from "../../../lib/discover-search";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") || "";
  if (query.length > 100) return NextResponse.json({ error: "Search must be under 100 characters." }, { status: 400 });
  try {
    const db = await createClient();
    const result = await searchDirectory(db, query);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Discover is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
