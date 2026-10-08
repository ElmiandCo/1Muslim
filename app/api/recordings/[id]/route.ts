import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "../../../../utils/supabase/server";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid recording ID" }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  // Never trust client-side admin flags or owner IDs.
  const { data: recording, error: readError } = await session.from("live_recordings")
    .select("id,user_id,video_path,thumbnail_path").eq("id", id).maybeSingle();
  const { data: adminRow } = await session.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  const isAdmin = !!adminRow;
  if (readError) return NextResponse.json({ error: "Unable to verify recording" }, { status: 500 });

  // Admins may need to access recordings hidden by row-level security.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Recording deletion is not configured" }, { status: 503 });
  const privileged = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: actual, error: lookupError } = await privileged.from("live_recordings")
    .select("id,user_id,video_path,thumbnail_path").eq("id", id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to load recording" }, { status: 500 });
  if (!actual) return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  if (!isAdmin && actual.user_id !== user.id) return NextResponse.json({ error: "Not permitted to delete this recording" }, { status: 403 });

  // Clear references before deleting the recording to avoid dangling links.
  const { error: unlinkError } = await privileged.from("live_streams").update({ recording_id: null }).eq("recording_id", id);
  if (unlinkError) return NextResponse.json({ error: "Could not detach recording from stream" }, { status: 500 });
  const { error: deleteError } = await privileged.from("live_recordings").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: "Could not delete recording" }, { status: 500 });

  const files = [...new Set([actual.video_path, actual.thumbnail_path].filter((p): p is string => typeof p === "string" && p.length > 0))];
  if (files.length) {
    const { error: storageError } = await privileged.storage.from("live-recordings").remove(files);
    if (storageError) {
      console.error("Recording deleted but storage cleanup failed", id, storageError.message);
      return NextResponse.json({ ok: true, storageCleanupPending: true });
    }
  }
  return NextResponse.json({ ok: true });
}
