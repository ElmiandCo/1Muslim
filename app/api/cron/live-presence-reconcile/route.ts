import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RoomServiceClient } from "livekit-server-sdk";
import { summarizeHostTracks } from "../../../../../lib/live-presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Candidate = { stream_id: string; room_name: string; host_id: string };

// Optional shared watchdog for missed LiveKit webhooks. A scheduler must be
// explicitly configured; this endpoint is NOT automatically activated.
// Never use it for per-viewer discovery or fixed-interval browser polling.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !livekitUrl || !apiKey || !apiSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Live reconciliation not configured" }, { status: 503 });
  }
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("list_live_presence_reconciliation_candidates", {
    p_limit: 50,
  });
  if (error) {
    console.error("Live reconciliation candidate query failed", { code: error.code });
    return NextResponse.json({ error: "Live reconciliation unavailable" }, { status: 503 });
  }

  const candidates = (data ?? []) as Candidate[];
  const livekit = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  let cursor = 0;
  let checked = 0;
  let changed = 0;
  let failed = 0;

  async function worker() {
    while (cursor < candidates.length) {
      const candidate = candidates[cursor++];
      if (!candidate) break;
      // Capture before the LiveKit request; older slow snapshots must not
      // supersede newer webhook or reconciliation observations.
      const observedAt = new Date().toISOString();
      let host = null;
      try {
        const participants = await livekit.listParticipants(candidate.room_name);
        host = participants.find(p => p.identity === candidate.host_id) ?? null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/404|not found|does not exist/i.test(message)) {
          failed++;
          console.warn("Live reconciliation room lookup failed", { code: "LIVEKIT_UNAVAILABLE" });
          continue; // Fail open to the existing state during a provider outage.
        }
      }
      const snapshot = summarizeHostTracks(host);
      const { data: transition, error } = await db.rpc("apply_livekit_presence_snapshot", {
        p_stream_id: candidate.stream_id,
        p_event_id: `reconcile:${randomUUID()}`,
        p_observed_at: observedAt,
        p_host_connected: snapshot.hostConnected,
        p_has_audio: snapshot.hasAudio,
        p_has_video: snapshot.hasVideo,
      });
      if (error) {
        failed++;
        console.warn("Live reconciliation transition failed", { code: error.code });
        continue;
      }
      checked++;
      if (transition?.[0]?.changed) changed++;
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, candidates.length) }, () => worker()));

  const { data: pruned, error: pruneError } = await db.rpc(
    "prune_live_presence_webhook_events", { p_limit: 2000 }
  );
  if (pruneError) console.warn("Live webhook dedupe pruning failed", { code: pruneError.code });

  return NextResponse.json(
    { ok: failed === 0 && !pruneError, checked, changed, failed, pruned: pruned ?? 0 },
    { headers: { "Cache-Control": "no-store" }, status: failed > 0 ? 503 : 200 }
  );
}
