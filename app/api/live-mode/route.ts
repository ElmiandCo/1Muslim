import { NextResponse } from "next/server";
import { createClient as sessionClient } from "../../../utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { RoomServiceClient } from "livekit-server-sdk";

export const runtime = "nodejs";

const modes = new Set(["phone", "desktop", "voice"]);

export async function POST(request: Request) {
  const session = await sessionClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const streamId = body.streamId;
  const mode = body.mode;
  if (typeof streamId !== "string" || !/^[0-9a-f-]{36}$/i.test(streamId))
    return NextResponse.json({ error: "Invalid stream ID" }, { status: 400 });
  if (typeof mode !== "string" || !modes.has(mode))
    return NextResponse.json({ error: "Invalid studio mode" }, { status: 400 });

  const { data: stream, error: lookupError } = await session.from("live_streams")
    .select("id,host_id,status").eq("id", streamId).eq("host_id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to verify stream" }, { status: 503 });
  if (!stream || stream.status !== "live")
    return NextResponse.json({ error: "Active host stream required" }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Live mode service not configured" }, { status: 503 });
  const db = createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // Serializes with guest approvals to prevent an over-capacity video stage.
  const { error } = await db.rpc("set_live_guest_stream_mode", {
    p_stream: streamId, p_mode: mode,
  });
  if (error) {
    if (error.code === "23514") return NextResponse.json({
      error: "Video supports three guests. Remove extra audio guests before switching.",
    }, { status: 409 });
    console.error("Live mode transition failed", { code: error.code });
    return NextResponse.json({ error: "Unable to update Live mode" }, { status: 503 });
  }
  // A video guest may still hold an older camera-publishing JWT when the
  // host switches to Audio. Server-mute those existing camera publications
  // immediately; the signed webhook rejects any newly published camera.
  if (mode === "voice") {
    const livekitUrl = process.env.LIVEKIT_URL;
    const livekitKey = process.env.LIVEKIT_API_KEY;
    const livekitSecret = process.env.LIVEKIT_API_SECRET;
    if (livekitUrl && livekitKey && livekitSecret) {
      const rooms = new RoomServiceClient(
        livekitUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:"),
        livekitKey, livekitSecret,
      );
      try {
        const participants = await rooms.listParticipants(`1muslim-live-${streamId}`);
        for (const participant of participants) {
          if (!/^[0-9a-f-]{36}$/i.test(participant.identity) || participant.identity === user.id) continue;
          for (const track of participant.tracks ?? []) {
            if (track.type === 1 || String(track.type) === "VIDEO") {
              try {
                await rooms.mutePublishedTrack(`1muslim-live-${streamId}`, participant.identity, track.sid, true);
              } catch {
                // Fallback: a camera must not remain published in Audio Live.
                await rooms.removeParticipant(`1muslim-live-${streamId}`, participant.identity);
              }
            }
          }
        }
      } catch (error) {
        console.error("Guest camera reconciliation after audio switch failed", error);
        // Database mode is already voice; client must still stop host video.
      }
    }
  }
  return NextResponse.json({ ok: true, mode }, { headers: { "Cache-Control": "no-store" } });
}
