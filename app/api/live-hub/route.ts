import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildLiveHub,
  type HubRecordingRow,
  type HubScheduleRow,
  type HubStreamRow,
} from "../../../lib/live-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only initial snapshot for the EXISTING /streaming (More/All Streams)
 * destination. Realtime live_presence remains the source of live updates;
 * clients must not poll this endpoint on a fixed short interval.
 *
 * Public-only results, even though the server uses service credentials to
 * join verified presence. No token, email, storage path or private recording
 * is returned. Scheduled metadata is already public in /streaming/scheduled.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "All Streams unavailable" }, { status: 503 });
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date();
  const [liveResult, replayResult, scheduleResult] = await Promise.all([
    db.from("live_streams")
      .select("id,host_id,title,category,room_name,status,visibility,viewer_count,started_at,scheduled_end_at,thumbnail_path,aspect_ratio,live_presence!inner(session_id,state,media_type,version)")
      .eq("status", "live")
      .eq("visibility", "public")
      .in("live_presence.state", ["READY_AUDIO", "READY_VIDEO"])
      .or(`scheduled_end_at.is.null,scheduled_end_at.gt.${now.toISOString()}`)
      .order("started_at", { ascending: false })
      .limit(100),
    db.from("live_recordings")
      .select("id,title,category,video_path,mime_type,duration_seconds,created_at,thumbnail_path,visibility")
      .eq("visibility", "public")
      .not("video_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(36),
    db.from("live_schedule_slots")
      .select("id,host_id,title,category,starts_at,ends_at,status,thumbnail_path,host_checked_in_at,camera_ready,mic_ready")
      .in("status", ["scheduled", "waiting"])
      .gt("ends_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(50),
  ]);
  const failures = [liveResult.error, replayResult.error, scheduleResult.error].filter(Boolean);
  if (failures.length) {
    console.error("All Streams snapshot failed", failures.map(error => error && ({ code: error.code })));
    // Fail closed: never substitute unverified status=live or private archives.
    return NextResponse.json({ error: "All Streams snapshot unavailable" }, { status: 503 });
  }
  const hub = buildLiveHub(
    (liveResult.data ?? []) as unknown as HubStreamRow[],
    (replayResult.data ?? []) as HubRecordingRow[],
    (scheduleResult.data ?? []) as HubScheduleRow[],
    now.getTime(),
  );
  return NextResponse.json({ ...hub, serverTime: now.toISOString() }, {
    headers: {
      "Cache-Control": "public, s-maxage=1, stale-while-revalidate=2",
      "Vary": "Accept-Encoding",
    },
  });
}
