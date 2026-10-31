import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public initial snapshot. Supabase Realtime live_presence changes are the
// primary update channel; this endpoint is for first load and recovery only.
// Do not add per-viewer fixed-interval polling.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Live discovery not configured" }, { status: 503 });
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.from("live_streams")
    .select("id,title,category,room_name,viewer_count,started_at,scheduled_end_at,thumbnail_path,aspect_ratio,host_id,live_presence!inner(session_id,state,media_type,version,changed_at)")
    .eq("status", "live")
    .eq("visibility", "public")
    .in("live_presence.state", ["READY_VIDEO", "READY_AUDIO"])
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Verified Live discovery failed", { code: error.code, message: error.message });
    // Fail closed: never fall back to unverified status=live results.
    return NextResponse.json({ error: "Verified discovery unavailable" }, { status: 503 });
  }
  return NextResponse.json({ lives: data ?? [], serverTime: new Date().toISOString() }, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=1",
      "Vary": "Accept-Encoding",
    },
  });
}
