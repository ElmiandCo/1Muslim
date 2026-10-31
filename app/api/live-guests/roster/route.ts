import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "../../../../utils/supabase/server";
import { guestLimitForAspectRatio } from "../../../../lib/live-guest-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f-]{36}$/i;

/** Public-safe approved stage roster; host additionally sees pending requests. */
export async function GET(request: Request) {
  const streamId = new URL(request.url).searchParams.get("streamId");
  if (!streamId || !uuidPattern.test(streamId)) {
    return NextResponse.json({ error: "Invalid stream ID" }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Guest roster unavailable" }, { status: 503 });
  }
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  const db = createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: stream, error: streamError } = await db.from("live_streams")
    .select("id,host_id,status,visibility,aspect_ratio")
    .eq("id", streamId).maybeSingle();
  if (streamError) return NextResponse.json({ error: "Guest roster unavailable" }, { status: 503 });
  if (!stream || stream.status !== "live") {
    return NextResponse.json({ error: "Stream not active" }, { status: 404 });
  }

  const host = user?.id === stream.host_id;
  const { data: seats, error: seatError } = await db.from("live_guest_requests")
    .select("id,user_id,status,mode,host_muted,approved_at,created_at")
    .eq("stream_id", streamId)
    .in("status", host ? ["pending", "approved"] : ["approved"])
    .order("approved_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (seatError) return NextResponse.json({ error: "Guest roster unavailable" }, { status: 503 });

  const approved = (seats ?? []).filter(s => s.status === "approved");
  const canSeePrivate = host || Boolean(user && approved.some(s => s.user_id === user.id));
  if (stream.visibility !== "public" && !canSeePrivate) {
    return NextResponse.json({ error: "Room access required" }, { status: 403 });
  }

  const ids = [...new Set((seats ?? []).map(s => s.user_id))];
  const profiles = new Map<string, Record<string, unknown>>();
  if (ids.length) {
    const { data, error: profilesError } = await db.from("profiles").select("*").in("id", ids);
    if (profilesError) console.warn("Guest roster profile lookup failed", { code: profilesError.code });
    for (const p of data ?? []) profiles.set(String(p.id), p);
  }
  const display = (seat: (typeof approved)[number]) => {
    const profile = profiles.get(seat.user_id);
    const username = profile?.username || profile?.display_name || "1Muslim guest";
    const avatar = profile?.avatar_url || profile?.profile_picture_url || profile?.avatar;
    return {
      requestId: seat.id,
      userId: seat.user_id,
      username: typeof username === "string" ? username : "1Muslim guest",
      avatarUrl: typeof avatar === "string" ? avatar : null,
      mode: seat.mode,
      hostMuted: seat.host_muted === true,
      approvedAt: seat.approved_at,
    };
  };
  return NextResponse.json({
    streamId,
    hostId: stream.host_id,
    mode: stream.aspect_ratio === "1:1" ? "audio" : "video",
    maxGuests: guestLimitForAspectRatio(stream.aspect_ratio),
    guests: approved.map(display),
    ...(host ? {
      requests: (seats ?? []).filter(s => s.status === "pending").map(display),
    } : {}),
  }, { headers: { "Cache-Control": "no-store" } });
}
