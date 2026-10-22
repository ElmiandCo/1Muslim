import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../../utils/supabase/server";

export const runtime = "nodejs";
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  let body: { roomId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const roomId = body?.roomId;
  if (typeof roomId !== "string" || !/^1muslim-public-audio-[0-9a-f-]{36}$/.test(roomId)) return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  const url = process.env.LIVEKIT_URL, key = process.env.LIVEKIT_API_KEY, secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  try {
    const service = new RoomServiceClient(url.replace(/^wss:/, "https:").replace(/^ws:/, "http:"), key, secret);
    const room = (await service.listRooms([roomId]))[0];
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    const info = JSON.parse(room.metadata || "{}") as { hostId?: string; source?: string };
    if (info.hostId !== user.id || info.source !== "game") return NextResponse.json({ error: "Only the host can end this room" }, { status: 403 });
    await service.deleteRoom(roomId);
    return NextResponse.json({ ended: true, roomId });
  } catch (e) { console.error("Public room shutdown failed", e); return NextResponse.json({ error: "Could not end room" }, { status: 502 }); }
}
