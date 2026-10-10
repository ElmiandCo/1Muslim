import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false }, { status: 401 });
  const { data, error } = await supabase.from("tiktok_connections").select("connected_at").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ connected: false, error: "status_unavailable" }, { status: 503 });
  return NextResponse.json({ connected: Boolean(data), connectedAt: data?.connected_at || null }, { headers: { "Cache-Control": "no-store" } });
}
