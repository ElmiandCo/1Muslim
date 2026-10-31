"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "../utils/supabase/client";
import { isDiscoverableLive, shouldApplyPresenceEvent } from "./live-discovery-state";

export type LivePresenceState = "STARTING" | "READY_AUDIO" | "READY_VIDEO" | "RECONNECTING" | "ENDED";
export type Presence = {
  stream_id: string;
  session_id: string;
  state: LivePresenceState;
  media_type: "none" | "audio" | "video";
  version: number;
  changed_at?: string;
};
export type VerifiedLive = {
  id: string;
  title: string;
  category: string;
  room_name: string;
  viewer_count: number;
  started_at: string;
  scheduled_end_at: string | null;
  thumbnail_path: string | null;
  aspect_ratio: string | null;
  host_id: string;
  live_presence: Omit<Presence, "stream_id"> | Omit<Presence, "stream_id">[];
};
type DiscoverySnapshot = {
  lives: VerifiedLive[];
  presence: Record<string, Presence>;
  ready: boolean;
  connected: boolean;
};

const EMPTY: DiscoverySnapshot = { lives: [], presence: {}, ready: false, connected: false };
let snapshot: DiscoverySnapshot = EMPTY;
const listeners = new Set<() => void>();
let supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() { return supabase ?? (supabase = createClient()); }
let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
let running = false;
let connected = false;
let inFlight = false;
let inFlightGeneration = -1;
let refreshQueued = false;
let generation = 0;
let retryCount = 0;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let lastRefresh = 0;
const delayedRefreshes = new Set<ReturnType<typeof setTimeout>>();
let snapshotFailures = 0;

function publish(next: DiscoverySnapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}


function normalizePresence(row: VerifiedLive): Presence | null {
  const embedded = Array.isArray(row.live_presence) ? row.live_presence[0] : row.live_presence;
  if (!embedded || !Number.isFinite(Number(embedded.version))) return null;
  return { ...embedded, stream_id: row.id, version: Number(embedded.version) };
}

function acceptEvent(incoming: Presence) {
  if (!incoming.stream_id || !Number.isFinite(Number(incoming.version))) return false;
  const event = { ...incoming, version: Number(incoming.version) };
  const previous = snapshot.presence[event.stream_id];
  // Monotonic versions prevent delayed READY messages resurrecting ENDED streams.
  if (!shouldApplyPresenceEvent(previous, event)) return false;
  const presence = { ...snapshot.presence, [event.stream_id]: event };
  const lives = isDiscoverableLive(event.state) ? snapshot.lives : snapshot.lives.filter(row => row.id !== event.stream_id);
  publish({ ...snapshot, presence, lives });
  return true;
}

function mergeSnapshot(rows: VerifiedLive[]) {
  const presence = { ...snapshot.presence };
  const lives: VerifiedLive[] = [];
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row.id || !row.room_name || ids.has(row.id)) continue;
    const embedded = normalizePresence(row);
    if (!embedded || !isDiscoverableLive(embedded.state)) continue;
    const previous = presence[row.id];
    if (previous?.state === "ENDED" || (previous && previous.session_id !== embedded.session_id)) continue;
    if (previous && previous.version > embedded.version) {
      if (!isDiscoverableLive(previous.state)) continue;
    } else {
      presence[row.id] = embedded;
    }
    ids.add(row.id);
    lives.push(row);
  }
  publish({ lives, presence, ready: true, connected });
}

function clearTimer(which: "fallback" | "refresh") {
  if (which === "fallback" && fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
  if (which === "refresh" && refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
}

function scheduleRefresh(delay = 80) {
  if (!running) return;
  clearTimer("refresh");
  refreshTimer = setTimeout(() => { refreshTimer = null; void refresh(); }, delay);
}

function scheduleFallback() {
  if (!running || connected || fallbackTimer) return;
  // Full-jitter bounded backoff; no fixed two-second polling per viewer.
  const ceiling = Math.min(30_000, 2_000 * 2 ** Math.min(retryCount, 4));
  const delay = Math.max(500, Math.floor(Math.random() * ceiling));
  retryCount = Math.min(retryCount + 1, 5);
  fallbackTimer = setTimeout(() => {
    fallbackTimer = null;
    if (!running || connected) return;
    void refresh();
    // Supabase can recover itself; rejoin if the channel has closed.
    if (!channel) connectRealtime();
    scheduleFallback();
  }, delay);
}

async function refresh() {
  if (!running) return;
  const currentGeneration = generation;
  if (inFlight && inFlightGeneration === currentGeneration) { refreshQueued = true; return; }
  inFlight = true;
  inFlightGeneration = currentGeneration;
  try {
    const response = await fetch("/api/live-discovery");
    if (!response.ok) throw new Error("Verified Live snapshot unavailable");
    const payload: { lives?: VerifiedLive[] } = await response.json();
    if (!running || generation !== currentGeneration) return;
    mergeSnapshot(Array.isArray(payload.lives) ? payload.lives : []);
    lastRefresh = Date.now();
    snapshotFailures = 0;
    if (connected) { retryCount = 0; clearTimer("fallback"); }
  } catch {
    // Never substitute status=live unverified rows when discovery fails.
    if (running && generation === currentGeneration) {
      if (!connected) scheduleFallback();
      else if (++snapshotFailures <= 5) scheduleRefresh(Math.min(30000, 2000 * 2 ** (snapshotFailures - 1)));
    }
  } finally {
    if (inFlightGeneration === currentGeneration) {
      inFlight = false;
      if (refreshQueued && running && generation === currentGeneration) {
        refreshQueued = false;
        scheduleRefresh(100);
      }
    }
  }
}

function connectRealtime() {
  if (!running || channel) return;
  const currentGeneration = generation;
  const activeChannel = getSupabase().channel("1muslim-live2-discovery")
    .on("postgres_changes", { event: "*", schema: "public", table: "live_presence" }, payload => {
      if (!running || generation !== currentGeneration || channel !== activeChannel) return;
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { stream_id?: string }).stream_id;
        if (id) { publish({ ...snapshot, lives: snapshot.lives.filter(row => row.id !== id) }); scheduleRefresh(1100); }
        return;
      }
      const event = payload.new as Presence;
      if (acceptEvent(event) && isDiscoverableLive(event.state)) {
        // The initial CDN snapshot can briefly precede the database commit.
        scheduleRefresh(80);
        const timer = setTimeout(() => {
          delayedRefreshes.delete(timer);
          if (running && generation === currentGeneration) scheduleRefresh(80);
        }, 1200);
        delayedRefreshes.add(timer);
      }
    });
  channel = activeChannel;
  activeChannel.subscribe(status => {
      if (!running || generation !== currentGeneration || channel !== activeChannel) return;
      if (status === "SUBSCRIBED") {
        connected = true;
        retryCount = 0;
        clearTimer("fallback");
        publish({ ...snapshot, connected: true });
        // Subscribe before snapshot to avoid missing a new Live during initialization.
        scheduleRefresh(0);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        connected = false;
        publish({ ...snapshot, connected: false });
        if (channel) {
          const stale = channel;
          channel = null;
          if (status !== "CLOSED") void getSupabase().removeChannel(stale);
        }
        scheduleFallback();
      }
    });
}

function onResume() {
  if (document.visibilityState === "visible" && Date.now() - lastRefresh > 3000) scheduleRefresh(0);
}

function start() {
  if (running) return;
  running = true;
  generation += 1;
  retryCount = 0;
  snapshotFailures = 0;
  refreshQueued = false;
  lastRefresh = 0;
  connected = false;
  connectRealtime();
  // Initial request is useful even if Realtime cannot subscribe.
  void refresh();
  document.addEventListener("visibilitychange", onResume);
  window.addEventListener("focus", onResume);
}

function stop() {
  running = false;
  generation += 1;
  connected = false;
  clearTimer("fallback");
  clearTimer("refresh");
  document.removeEventListener("visibilitychange", onResume);
  window.removeEventListener("focus", onResume);
  delayedRefreshes.forEach(timer => clearTimeout(timer));
  delayedRefreshes.clear();
  if (channel) { void getSupabase().removeChannel(channel); channel = null; }
  snapshot = EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

export function useLiveDiscovery() {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
