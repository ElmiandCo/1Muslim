import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const runtime = "nodejs";

// Called by the host only after LiveKit has connected and publishing has begun.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const streamId = typeof body.streamId === "string" ? body.streamId : "";
  if (!/^[a-f0-9-]{36}$/i.test(streamId)) return NextResponse.json({ error: "Invalid stream" }, { status: 400 });
  const { data: stream } = await supabase.from("live_streams").select("id,host_id,title,category,status,started_at").eq("id", streamId).eq("host_id", user.id).maybeSingle();
  if (!stream || stream.status !== "live") return NextResponse.json({ error: "Stream not active or not yours" }, { status: 403 });
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.ADMIN_LIVE_ALERT_EMAIL;
  const sender = process.env.LIVE_ALERT_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) return NextResponse.json({ error: "Email notifications are not configured" }, { status: 503 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://1muslim.vercel.app";
  const link = origin.replace(/\/$/, "") + "/streaming/live/" + stream.id;
  const host = user.user_metadata?.full_name || user.email || "1Muslim host";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": "1muslim-live-" + stream.id },
    body: JSON.stringify({ from: sender, to: [recipient], subject: "🔴 1Muslim Live: " + stream.title, text: "A 1Muslim member just went live.\n\nHost: " + host + "\nTitle: " + stream.title + "\nCategory: " + stream.category + "\nStarted: " + stream.started_at + "\nWatch: " + link })
  });
  if (!response.ok) { console.error("Live alert email failed", response.status); return NextResponse.json({ error: "Email provider rejected notification" }, { status: 502 }); }
  return NextResponse.json({ ok: true });
}
