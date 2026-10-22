import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { createClient } from "../../../../../utils/supabase/server";

export const runtime = "nodejs";
const prefix = "1muslim-public-audio-";
const setup = () => {
  const url = process.env.LIVEKIT_URL, key = process.env.LIVEKIT_API_KEY, secret = process.env.LIVEKIT_API_SECRET;
  return url && key && secret ? { url, key, secret, rooms: new RoomServiceClient(url.replace(/^wss:/, "https:").replace(/^ws:/, "http:"), key, secret) } : null;
};
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const conf = setup();
  if (!conf) return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  let body: { roomId?: unknown; mode?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const roomId = body?.roomId;
  if (typeof roomId !== "string" || !roomId.startsWith(prefix) || !/^1muslim-public-audio-[0-9a-f-]{36}$/.test(roomId)) {
    return NextResponse.json({ error: "Invalid public room" }, { status: 400 });
  }
  try {
    const room = (await conf.rooms.listRooms([roomId]))[0];
    if (!room) return NextResponse.json({ error: "Room is no longer available" }, { status: 404 });
    const info = JSON.parse(room.metadata || "{}") as { hostId?: string; visibility?: string; source?: string };
    if (info.visibility !== "public" || info.source !== "game" || !info.hostId) return NextResponse.json({ error: "Room is not public" }, { status: 403 });
    const isHost = Boolean(user && user.id === info.hostId);
    const wantsSpeak = body.mode === "speaker";
    if (wantsSpeak && !user) return NextResponse.json({ error: "Sign in to speak" }, { status: 401 });
    if (wantsSpeak && !isHost) return NextResponse.json({ error: "Only the host can publish audio until guest approvals are enabled" }, { status: 403 });
    const token = new AccessToken(conf.key, conf.secret, {
      identity: user ? (isHost ? user.id : user.id + ":listener:" + crypto.randomUUID()) : "public-listener:" + crypto.randomUUID(),
      name: user?.user_metadata?.full_name || "1Muslim listener",
      ttl: "30m"
    });
    token.addGrant({ roomJoin: true, room: roomId, canSubscribe: true, canPublish: wantsSpeak && isHost, canPublishSources: wantsSpeak && isHost ? [TrackSource.MICROPHONE] : [], canPublishData: false });
    return NextResponse.json({ token: await token.toJwt(), url: conf.url, roomId, role: wantsSpeak && isHost ? "host" : "listener" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { console.error("Public audio token failed", e); return NextResponse.json({ error: "Could not join room" }, { status: 502 }); }
}
