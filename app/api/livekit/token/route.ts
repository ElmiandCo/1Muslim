import { NextResponse } from "next/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";
import { guestLimitForAspectRatio, guestMayPublishCamera, guestMayPublishMicrophone } from "../../../../lib/live-guest-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LiveRole = "host" | "guest" | "companion" | "viewer";
const roomPattern = /^1muslim-live-[0-9a-f-]{36}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json().catch(() => ({}));
    const room = typeof body?.room === "string" ? body.room.trim() : "";
    const role: LiveRole =
      body?.role === "host" || body?.role === "guest" || body?.role === "companion"
        ? body.role : "viewer";

    if (!roomPattern.test(room)) {
      return NextResponse.json({ error: "Invalid live room." }, { status: 400 });
    }
    const { data: liveStream, error: streamError } = await supabase
      .from("live_streams")
      .select("id, host_id, status, visibility, aspect_ratio")
      .eq("room_name", room).maybeSingle();
    if (streamError) {
      return NextResponse.json({ error: "Could not verify the live stream." }, { status: 503 });
    }
    if (!liveStream || liveStream.status !== "live") {
      return NextResponse.json({ error: "This live stream is no longer active." }, { status: 404 });
    }

    if (!user && (role !== "viewer" || liveStream.visibility !== "public")) {
      return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    }
    if ((role === "host" || role === "companion") && liveStream.host_id !== user?.id) {
      return NextResponse.json({ error: "Only the host may use this role." }, { status: 403 });
    }
    if (role === "viewer" && liveStream.visibility !== "public" && liveStream.host_id !== user?.id) {
      return NextResponse.json({ error: "This stream is private." }, { status: 403 });
    }

    const audioOnly = liveStream.aspect_ratio === "1:1";
    let guestMode: "pfp" | "camera" | null = null;
    let guestMuted = false;
    if (role === "guest") {
      // The database RPC is the only authority for stage approval. Do not
      // accept seat count, mode, identity or permission from the request body.
      const { data: seat, error: seatError } = await supabase
        .from("live_guest_requests")
        .select("id, mode, host_muted")
        .eq("stream_id", liveStream.id)
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .maybeSingle();
      if (seatError) {
        return NextResponse.json({ error: "Unable to verify guest approval." }, { status: 503 });
      }
      if (!seat) {
        return NextResponse.json({ error: "The host must approve your guest request first." }, { status: 403 });
      }
      guestMode = seat.mode === "camera" ? "camera" : "pfp";
      guestMuted = seat.host_muted === true;
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({
        error: "LiveKit is not configured.",
        code: "LIVEKIT_NOT_CONFIGURED",
      }, { status: 503 });
    }

    const identity = !user
      ? `anonymous-viewer:${crypto.randomUUID()}`
      : role === "viewer"
        ? `${user.id}:viewer:${crypto.randomUUID()}`
        : role === "companion"
          ? `${user.id}:screen:${crypto.randomUUID()}`
          : user.id;

    const canPublish = role === "host" || role === "guest" || role === "companion";
    const publishSources = role === "companion"
      ? [TrackSource.SCREEN_SHARE]
      : role === "guest"
        ? [
          ...(guestMayPublishMicrophone(guestMuted) ? [TrackSource.MICROPHONE] : []),
          ...(guestMayPublishCamera(liveStream.aspect_ratio, guestMode ?? "pfp") ? [TrackSource.CAMERA] : []),
        ]
        : undefined;

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: user?.user_metadata?.full_name || user?.email || "1Muslim viewer",
      // Short-lived guest tickets narrow the window for reusing a revoked
      // token. An established LiveKit connection is not ended by JWT expiry.
      ttl: role === "guest" ? "2m" : "2h",
    });
    token.addGrant({
      roomJoin: true,
      room,
      canPublish,
      canPublishSources: publishSources,
      canSubscribe: true,
      // Only the host sends authoritative terminal data packets.
      canPublishData: role === "host",
    });

    return NextResponse.json({
      token: await token.toJwt(),
      url: livekitUrl,
      role,
      mode: audioOnly ? "audio" : "video",
      maxGuests: guestLimitForAspectRatio(liveStream.aspect_ratio),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("LiveKit token error", error);
    return NextResponse.json({ error: "Could not create the live connection." }, { status: 500 });
  }
}
