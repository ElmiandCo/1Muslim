import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    }

    const body = await request.json();
    const room = typeof body?.room === "string" ? body.room.trim() : "";
    const role = body?.role === "host" ? "host" : body?.role === "guest" ? "guest" : "viewer";

    if (!room || !/^1muslim-live-[a-zA-Z0-9-]+$/.test(room)) {
      return NextResponse.json({ error: "Invalid live room." }, { status: 400 });
    }

    const { data: liveStream } = await supabase
      .from("live_streams")
      .select("id, host_id, status")
      .eq("room_name", room)
      .maybeSingle();

    if (!liveStream || liveStream.status !== "live") {
      return NextResponse.json({ error: "This live stream is no longer active." }, { status: 404 });
    }

    if (role === "host" && liveStream.host_id !== user.id) {
      return NextResponse.json({ error: "You are not the host of this live." }, { status: 403 });
    }

    if (role === "guest") {
      const {data:seat}=await supabase.from("live_guest_requests").select("id").eq("stream_id",liveStream.id).eq("user_id",user.id).eq("status","approved").maybeSingle();
      if (!seat) return NextResponse.json({error:"The host must approve your guest request first."},{status:403});
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({
        error: "LiveKit is not configured yet. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in Vercel.",
        code: "LIVEKIT_NOT_CONFIGURED",
      }, { status: 503 });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: user.user_metadata?.full_name || user.email || "1Muslim user",
      ttl: "2h",
    });

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: role === "host" || role === "guest",
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json({ token: await token.toJwt(), url: livekitUrl });
  } catch (error) {
    console.error("LiveKit token error", error);
    return NextResponse.json({ error: "Could not create the live connection." }, { status: 500 });
  }
}
