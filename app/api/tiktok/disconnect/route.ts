import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { data: connection } = await supabase.from("tiktok_connections").select("access_token").eq("user_id", user.id).maybeSingle();
  if (connection?.access_token) {
    try { await fetch("https://open.tiktokapis.com/v2/oauth/revoke/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY || "", client_secret: process.env.TIKTOK_CLIENT_SECRET || "", token: connection.access_token }), signal: AbortSignal.timeout(5000) }); } catch { /* Local disconnect still removes stored tokens. */ }
  }
  const { error } = await supabase.from("tiktok_connections").delete().eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not disconnect" }, { status: 500 });
  return NextResponse.json({ connected: false });
}
