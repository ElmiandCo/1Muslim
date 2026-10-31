import { NextResponse } from "next/server";
import { createClient as sessionClient } from "../../../utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const modes = {
  phone: { aspect_ratio: "9:16", video_width: 720, video_height: 1280 },
  desktop: { aspect_ratio: "16:9", video_width: 1280, video_height: 720 },
  voice: { aspect_ratio: "1:1", video_width: 720, video_height: 720 },
} as const;

export async function POST(request: Request) {
  const session = await sessionClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const streamId = body.streamId;
  const mode = body.mode;
  if (typeof streamId !== "string" || !/^[0-9a-f-]{36}$/i.test(streamId))
    return NextResponse.json({ error: "Invalid stream ID" }, { status: 400 });
  if (typeof mode !== "string" || !(mode in modes))
    return NextResponse.json({ error: "Invalid studio mode" }, { status: 400 });

  const { data: stream, error: lookupError } = await session.from("live_streams")
    .select("id,host_id,status").eq("id", streamId).eq("host_id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to verify stream" }, { status: 503 });
  if (!stream || stream.status !== "live")
    return NextResponse.json({ error: "Active host stream required" }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Live mode service not configured" }, { status: 503 });
  const db = createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("live_streams")
    .update(modes[mode as keyof typeof modes])
    .eq("id", streamId).eq("host_id", user.id).eq("status", "live").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update Live mode" }, { status: 503 });
  if (!data) return NextResponse.json({ error: "Stream is no longer live" }, { status: 409 });
  return NextResponse.json({ ok: true, mode }, { headers: { "Cache-Control": "no-store" } });
}
