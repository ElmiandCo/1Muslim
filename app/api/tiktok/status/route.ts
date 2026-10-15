import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ connected: false, error: "status_unavailable" }, { status: 503 });
  const admin = createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.from("tiktok_connections")
    .select("connected_at,access_token,expires_at").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ connected: false, error: "status_unavailable" }, { status: 503 });
  if (!data) return NextResponse.json({ connected: false }, { headers: { "Cache-Control": "no-store" } });

  let profile: { displayName: string; username: string; avatarUrl: string } | null = null;
  let profileUnavailable = false;
  if (data.access_token && (!data.expires_at || Date.parse(data.expires_at) > Date.now())) {
    try {
      const response = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url", {
        headers: { Authorization: `Bearer ${data.access_token}` }, cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      const payload = await response.json();
      const info = payload?.data?.user;
      if (response.ok && payload?.error?.code === "ok" && info) {
        profile = {
          displayName: typeof info.display_name === "string" ? info.display_name : "",
          username: typeof info.username === "string" ? info.username : "",
          avatarUrl: typeof info.avatar_url === "string" && /^https:\/\//.test(info.avatar_url) ? info.avatar_url : "",
        };
      } else profileUnavailable = true;
    } catch { profileUnavailable = true; }
  } else profileUnavailable = true;
  return NextResponse.json({
    connected: true, connectedAt: data.connected_at, profile, profileUnavailable,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
