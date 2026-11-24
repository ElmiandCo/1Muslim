import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { isTikTokVideoId, verifiedTikTokVideo } from "../../../../utils/tiktok/public-video";
import { canUseTikTokReview } from "../../../../utils/tiktok/review-access";

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return failure("Sign in required.", 401);
  if (!canUseTikTokReview(user)) return failure("TikTok review access required.", 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return failure("Invalid origin.", 403);
  }

  const input = await request.json().catch(() => null);
  if (!isTikTokVideoId(input?.id)) return failure("Invalid TikTok video.", 400);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return failure("Connection storage unavailable.", 503);
  const admin = createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: connection, error: connectionError } = await admin
    .from("tiktok_connections")
    .select("access_token,connected_at,expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (connectionError) return failure("Could not read TikTok connection.", 503);
  if (!connection) return failure("Connect TikTok before sharing.", 409);
  if (Date.parse(connection.expires_at) <= Date.now()) {
    return failure("TikTok access expired. Refresh your gallery and retry.", 409);
  }

  // Display API returns only public videos belonging to the access token's owner.
  const response = await fetch("https://open.tiktokapis.com/v2/video/query/?fields=id,title,video_description,share_url", {
    method: "POST",
    headers: { Authorization: `Bearer ${connection.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ filters: { video_ids: [input.id] } }),
    signal: AbortSignal.timeout(10000),
    redirect: "error",
    cache: "no-store",
  }).catch(() => null);
  const payload = await response?.json().catch(() => null);
  if (response?.status === 401 || payload?.error?.code === "access_token_invalid") {
    return failure("TikTok authorization expired or was revoked. Refresh or reconnect TikTok.", 409);
  }
  if (payload?.error?.code === "scope_not_authorized") {
    return failure("Reconnect TikTok and grant video.list to share public videos.", 403);
  }
  if (response?.status === 429) return failure("TikTok is rate limiting requests. Try again later.", 429);
  if (!response?.ok || payload?.error?.code !== "ok" || !Array.isArray(payload?.data?.videos)) {
    return failure("Could not verify this video with TikTok. Try again later.", 502);
  }

  const video = verifiedTikTokVideo(payload.data.videos[0], input.id);
  if (!video) return failure("This video is no longer available in your public TikTok gallery.", 404);

  const { data, error } = await admin.rpc("publish_verified_tiktok_video", {
    p_user_id: user.id,
    p_connected_at: connection.connected_at,
    p_video_id: video.id,
    p_title: video.title,
    p_url: video.url,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row?.post_id) return failure("Could not share TikTok video. Refresh your connection and try again.", 503);
  return NextResponse.json({ postId: row.post_id, alreadyShared: row.already_shared }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
