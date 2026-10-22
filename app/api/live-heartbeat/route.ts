import { NextResponse } from "next/server";
import { createClient as sessionClient } from "../../../../utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await sessionClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const streamId = body.streamId;
  if (typeof streamId !== "string" || !/^[0-9a-f-]{36}$/i.test(streamId))
    return NextResponse.json({ error: "Invalid stream ID" }, { status: 400 });
  const { data: stream, error: lookupError } = await session.from("live_streams")
    .select("id,host_id,status").eq("id", streamId).eq("host_id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to verify stream" }, { status: 503 });
  if (!stream || stream.status !== "live")
    return NextResponse.json({ error: "Active host stream required" }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Heartbeat service not configured" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("live_streams")
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq("id", streamId).eq("host_id", user.id).eq("status", "live").select("id").maybeSingle();
  if (error) {
    console.error("Live heartbeat database update failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Heartbeat update failed" }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: "Stream no longer active" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
