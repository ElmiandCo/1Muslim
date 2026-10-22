import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const prefix = "1muslim-public-audio-";
const config = () => {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) return null;
  return new RoomServiceClient(url.replace(/^wss:/, "https:").replace(/^ws:/, "http:"), key, secret);
};
type RoomInfo = { title: string; hostId: string; createdAt: string; visibility: "public"; source: "game" };
const parse = (metadata: string): RoomInfo | null => {
  try {
    const m: unknown = JSON.parse(metadata);
    if (!m || typeof m !== "object") return null;
    const r = m as Record<string, unknown>;
    return typeof r.title === "string" && typeof r.hostId === "string" && r.visibility === "public" && r.source === "game"
      ? { title: r.title, hostId: r.hostId, createdAt: String(r.createdAt || ""), visibility: "public", source: "game" }
      : null;
  } catch { return null; }
};
export async function GET() {
  const service = config();
  if (!service) return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  try {
    const rooms = await service.listRooms();
    return NextResponse.json({ rooms: rooms.filter(r => r.name.startsWith(prefix)).flatMap(r => {
      const info = parse(r.metadata);
      return info ? [{ id: r.name, title: info.title, hostId: info.hostId, createdAt: info.createdAt, participants: r.numParticipants }] : [];
    }) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { console.error("Public audio discovery failed", e); return NextResponse.json({ error: "Room discovery unavailable" }, { status: 502 }); }
}
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to start a public room" }, { status: 401 });
  const service = config();
  if (!service) return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const title = typeof (body as { title?: unknown })?.title === "string" ? (body as { title: string }).title.trim() : "";
  if (title.length < 3 || title.length > 80) return NextResponse.json({ error: "Title must be 3–80 characters" }, { status: 400 });
  try {
    const existing = (await service.listRooms()).find(r => r.name.startsWith(prefix) && parse(r.metadata)?.hostId === user.id);
    if (existing) return NextResponse.json({ error: "End your existing public room first", roomId: existing.name }, { status: 409 });
    const id = prefix + crypto.randomUUID();
    const metadata: RoomInfo = { title, hostId: user.id, createdAt: new Date().toISOString(), visibility: "public", source: "game" };
    await service.createRoom({ name: id, metadata: JSON.stringify(metadata), emptyTimeout: 600, maxParticipants: 100 });
    return NextResponse.json({ id, title, visibility: "public" }, { status: 201 });
  } catch (e) { console.error("Public audio creation failed", e); return NextResponse.json({ error: "Could not create room" }, { status: 502 }); }
}
