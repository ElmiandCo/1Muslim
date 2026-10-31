import { NextResponse } from "next/server";
import { createClient as sessionClient } from "../../../utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { RoomServiceClient } from "livekit-server-sdk";

export const runtime = "nodejs";

/**
 * Authoritative, host-only end signal. Commit terminal state before closing the
 * LiveKit room so viewers' realtime subscription and polling both see "ended".
 * Safe to retry when the host's network fails after the database commit.
 */
export async function POST(request: Request) {
  const session = await sessionClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const streamId = body.streamId;
  if (typeof streamId !== "string" || !/^[0-9a-f-]{36}$/i.test(streamId))
    return NextResponse.json({ error: "Invalid stream ID" }, { status: 400 });

  const { data: stream, error: lookupError } = await session.from("live_streams")
    .select("id,host_id,room_name,status").eq("id", streamId).eq("host_id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to verify stream" }, { status: 503 });
  if (!stream) return NextResponse.json({ error: "Host stream not found" }, { status: 404 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "End Live service not configured" }, { status: 503 });
  const db = createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (stream.status === "live") {
    const { error: updateError } = await db.from("live_streams")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", streamId).eq("host_id", user.id).eq("status", "live");
    if (updateError) {
      console.error("End Live status update failed", { code: updateError.code, message: updateError.message });
      return NextResponse.json({ error: "Unable to end Live" }, { status: 503 });
    }
  } else if (stream.status !== "ended" && stream.status !== "cancelled") {
    return NextResponse.json({ error: "Stream cannot be ended from its current state" }, { status: 409 });
  }

  // Best-effort room teardown. The authoritative DB state is already terminal.
  let roomClosed = false;
  const livekitUrl = process.env.LIVEKIT_URL;
  const livekitKey = process.env.LIVEKIT_API_KEY;
  const livekitSecret = process.env.LIVEKIT_API_SECRET;
  if (livekitUrl && livekitKey && livekitSecret) {
    try {
      await new RoomServiceClient(livekitUrl, livekitKey, livekitSecret).deleteRoom(stream.room_name);
      roomClosed = true;
    } catch (error) {
      console.warn("LiveKit room teardown skipped after terminal status committed", error);
    }
  }
  return NextResponse.json({ ok: true, ended: true, roomClosed }, { headers: { "Cache-Control": "no-store" } });
}
