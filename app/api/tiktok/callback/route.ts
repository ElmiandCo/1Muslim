import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { timingSafeEqual } from "node:crypto";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const destination = new URL("/tiktok", origin);
  const finish = (error?: string, connected?: boolean) => {
    if (error) destination.searchParams.set("error", error);
    if (connected) destination.searchParams.set("connected", "1");
    const response = NextResponse.redirect(destination);
    response.cookies.delete("tt_oauth_state");
    response.cookies.delete("tt_oauth_user");
    return response;
  };
  const state = request.nextUrl.searchParams.get("state") || "";
  const expected = request.cookies.get("tt_oauth_state")?.value || "";
  if (!state || !expected || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) return finish("invalid_state");
  if (request.nextUrl.searchParams.has("error")) return finish("authorization_declined");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return finish("missing_code");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== request.cookies.get("tt_oauth_user")?.value) return finish("session_expired");
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) return finish("configuration");
  const params = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: new URL("/api/tiktok/callback", origin).toString() });
  try {
    const result = await fetch("https://open.tiktokapis.com/v2/oauth/token/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-store" }, body: params.toString(), cache: "no-store" });
    const token = await result.json();
    if (!result.ok || !token.access_token || !token.open_id) return finish("token_exchange");
    const { error } = await supabase.from("tiktok_connections").upsert({ user_id: user.id, open_id: token.open_id, access_token: token.access_token, refresh_token: token.refresh_token, expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(), connected_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) return finish("storage");
    return finish(undefined, true);
  } catch { return finish("network"); }
}
