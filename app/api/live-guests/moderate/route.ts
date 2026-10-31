import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f-]{36}$/i;
type Action = "approved" | "rejected" | "removed" | "mute" | "unmute";

/**
 * Host-only guest moderation. Database changes are serialized by the
 * stream-row lock in the Supabase RPC. LiveKit is reconciled afterwards.
 */
export async function POST(request: Request) {
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const requestId = body?.requestId;
  const action: Action | null =
    ["approved", "rejected", "removed", "mute", "unmute"].includes(body?.action)
      ? body.action : null;
  if (typeof requestId !== "string" || !uuidPattern.test(requestId) || !action) {
    return NextResponse.json({ error: "Invalid moderation request" }, { status: 400 });
  }

  const { data: seat, error: seatError } = await session.from("live_guest_requests")
    .select("id, stream_id, user_id, status")
    .eq("id", requestId).maybeSingle();
  if (seatError) return NextResponse.json({ error: "Guest request unavailable" }, { status: 503 });
  if (!seat) return NextResponse.json({ error: "Guest request not found" }, { status: 404 });

  const { data: stream, error: streamError } = await session.from("live_streams")
    .select("id, host_id, status, room_name")
    .eq("id", seat.stream_id).maybeSingle();
  if (streamError) return NextResponse.json({ error: "Stream unavailable" }, { status: 503 });
  if (!stream || stream.host_id !== user.id || stream.status !== "live") {
    return NextResponse.json({ error: "Active host access required" }, { status: 403 });
  }

  const needsLiveKit = action === "removed" || action === "mute" || action === "unmute";
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (needsLiveKit && (!url || !key || !secret)) {
    return NextResponse.json({ error: "LiveKit moderation unavailable" }, { status: 503 });
  }

  const rpc = action === "mute" || action === "unmute"
    ? session.rpc("set_live_guest_host_mute", {
      p_request: requestId, p_muted: action === "mute",
    })
    : session.rpc("moderate_live_guest", {
      p_request: requestId, p_status: action,
    });
  const { error } = await rpc;
  if (error) {
    const full = error.code === "23514";
    const invalid = error.code === "22023";
    return NextResponse.json({
      error: full ? "Guest stage is full for the current live mode."
        : invalid ? "Guest request cannot make that transition."
        : "Could not moderate guest request.",
      code: error.code,
    }, { status: full || invalid ? 409 : error.code === "42501" ? 403 : 503 });
  }

  if (needsLiveKit && url && key && secret) {
    const rooms = new RoomServiceClient(
      url.replace(/^wss:/, "https:").replace(/^ws:/, "http:"), key, secret,
    );
    try {
      if (action === "removed") {
        // Removal must terminate the active participant, not merely change UI.
        await rooms.removeParticipant(stream.room_name, seat.user_id);
      } else {
        const participants = await rooms.listParticipants(stream.room_name);
        const guest = participants.find(p => p.identity === seat.user_id);
        if (guest) {
          for (const track of guest.tracks ?? []) {
            if (track.type === 0 || String(track.type) === "AUDIO") {
              await rooms.mutePublishedTrack(
                stream.room_name, seat.user_id, track.sid, action === "mute",
              );
            }
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // A guest may have already disconnected before the host action.
      if (!/404|not found|does not exist|participant.*not.*found/i.test(message)) {
        console.error("Guest LiveKit moderation failed", { action, message });
        return NextResponse.json({
          error: "Guest state saved, but LiveKit moderation needs retry.",
          applied: true,
        }, { status: 503 });
      }
    }
  }

  return NextResponse.json({ ok: true, action }, {
    headers: { "Cache-Control": "no-store" },
  });
}
