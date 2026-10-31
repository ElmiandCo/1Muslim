import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RoomServiceClient, WebhookReceiver } from "livekit-server-sdk";
import { summarizeHostTracks } from "../../../../lib/live-presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const relevantEvents = new Set([
  "room_started", "room_finished", "participant_joined", "participant_left",
  "participant_connection_aborted", "track_published", "track_unpublished",
]);
const roomPattern = /^1muslim-live-[a-f0-9-]{36}$/i;

// LiveKit webhook verification uses the unmodified raw body and Authorization
// header; this endpoint deliberately accepts no browser/user-generated state.
export async function POST(request: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !apiSecret || !livekitUrl || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Live presence not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 256_000) {
    return NextResponse.json({ error: "Webhook too large" }, { status: 413 });
  }

  let event;
  try {
    event = await new WebhookReceiver(apiKey, apiSecret)
      .receive(raw, request.headers.get("authorization") ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid LiveKit signature" }, { status: 401 });
  }

  if (!relevantEvents.has(event.event)) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  const roomName = event.room?.name ?? "";
  if (!roomPattern.test(roomName)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: stream, error: lookupError } = await db.from("live_streams")
    .select("id,host_id,status,room_name")
    .eq("room_name", roomName).maybeSingle();
  if (lookupError) {
    console.error("Live presence lookup failed", { code: lookupError.code });
    return NextResponse.json({ error: "Presence lookup unavailable" }, { status: 503 });
  }
  if (!stream || stream.status !== "live") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Guest and viewer track events cannot make a stream READY.
  if (event.participant?.identity && event.participant.identity !== stream.host_id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Query LiveKit's current room state rather than trusting webhook arrival
  // order or a track-published event that may already be obsolete.
  let host = null;
  try {
    const participants = await new RoomServiceClient(livekitUrl, apiKey, apiSecret)
      .listParticipants(roomName);
    host = participants.find(participant => participant.identity === stream.host_id) ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/404|not found|does not exist/i.test(message)) {
      console.error("LiveKit presence snapshot failed", { roomName, message });
      return NextResponse.json({ error: "LiveKit snapshot unavailable" }, { status: 503 });
    }
    // Room already closed; a disconnected host is RECONNECTING, not ENDED.
  }

  const snapshot = summarizeHostTracks(host);
  const eventId = event.id || createHash("sha256").update(raw).digest("hex");
  const { data, error } = await db.rpc("apply_livekit_presence_snapshot", {
    p_stream_id: stream.id,
    p_event_id: eventId,
    p_observed_at: new Date().toISOString(),
    p_host_connected: snapshot.hostConnected,
    p_has_audio: snapshot.hasAudio,
    p_has_video: snapshot.hasVideo,
  });
  if (error) {
    console.error("Live presence state transition failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Presence transition unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    changed: data?.[0]?.changed ?? false,
  }, { headers: { "Cache-Control": "no-store" } });
}
