import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../../utils/supabase/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_1muslim_admin");
    if (adminError || !isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const streamId = typeof body?.streamId === "string" ? body.streamId : "";
    if (!streamId) return NextResponse.json({ error: "A live stream id is required." }, { status: 400 });
    const { data: stream, error: streamError } = await supabase.from("live_streams").select("id,room_name,status").eq("id", streamId).maybeSingle();
    if (streamError) return NextResponse.json({ error: streamError.message }, { status: 500 });
    if (!stream) return NextResponse.json({ error: "Live stream not found." }, { status: 404 });
    if (stream.status !== "live") return NextResponse.json({ error: "This Live is no longer active." }, { status: 409 });
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !livekitUrl) return NextResponse.json({ error: "LiveKit is not configured." }, { status: 503 });
    try {
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
      await roomService.deleteRoom(stream.room_name);
    } catch (error) {
      console.error("LiveKit admin shutdown error", error);
      return NextResponse.json({ error: "LiveKit could not shut down the broadcast. The Live was left active." }, { status: 502 });
    }
    const endedAt = new Date().toISOString();
    const { error: updateError } = await supabase.from("live_streams").update({ status: "cancelled", ended_at: endedAt, last_heartbeat_at: null }).eq("id", streamId).eq("status", "live");
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    await supabase.from("live_moderation_actions").insert({ admin_id: user.id, stream_id: streamId, action: "shutdown_live" });
    return NextResponse.json({ ok: true, streamId, status: "cancelled" });
  } catch (error) {
    console.error("Admin live shutdown error", error);
    return NextResponse.json({ error: "Could not shut down the Live." }, { status: 500 });
  }
}