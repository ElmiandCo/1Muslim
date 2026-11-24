import { registeredTikTokCallback } from "../../../../utils/tiktok/oauth";
import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { randomBytes } from "node:crypto";
import { canUseTikTokReview } from "../../../../utils/tiktok/review-access";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const origin = new URL(request.url).origin;
  if (!user) return NextResponse.redirect(new URL("/login?next=/tiktok", origin));
  if (!canUseTikTokReview(user)) return NextResponse.redirect(new URL("/tiktok?available=0", origin));
  const key = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = registeredTikTokCallback(origin);
  if (!redirectUri || !key || !process.env.TIKTOK_CLIENT_SECRET) return NextResponse.redirect(new URL("/profile?section=tiktok&error=configuration", origin));
  const state = randomBytes(32).toString("hex");
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", key);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user.info.basic,video.list");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  const response = NextResponse.redirect(url);
  response.cookies.set("tt_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  response.cookies.set("tt_oauth_user", user.id, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
