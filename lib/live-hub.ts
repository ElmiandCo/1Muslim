/** Public, read-only contracts for the existing /streaming (All Streams) hub.
 * The database and LiveKit presence service remain the source of truth.
 * No client-supplied 'isLive' value can make a broadcast discoverable.
 */
export type Presence = {
  session_id: string;
  state: string;
  media_type: string;
  version: number;
};
export type HubStreamRow = {
  id: string;
  host_id: string;
  title: string;
  category: string | null;
  room_name: string;
  status: string;
  visibility: string;
  viewer_count: number | null;
  started_at: string;
  scheduled_end_at: string | null;
  thumbnail_path: string | null;
  aspect_ratio: string | null;
  live_presence: Presence | Presence[] | null;
};
export type HubRecordingRow = {
  id: string;
  title: string;
  category: string | null;
  video_path: string | null;
  mime_type: string | null;
  duration_seconds: number | null;
  created_at: string;
  thumbnail_path: string | null;
  visibility: string;
};
export type HubScheduleRow = {
  id: string;
  host_id: string;
  title: string;
  category: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  thumbnail_path: string | null;
  host_checked_in_at: string | null;
  camera_ready: boolean | null;
  mic_ready: boolean | null;
};

export function isGameStreamCategory(category: string | null | undefined): boolean {
  return /(?:^|[\s/_,-])(?:games?|gaming|gameplay|e-?sports?)(?:$|[\s/_,-])/i.test(category ?? "");
}

function isValidDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function buildLiveHub(
  streams: HubStreamRow[],
  recordings: HubRecordingRow[],
  schedules: HubScheduleRow[],
  nowMs: number = Date.now(),
) {
  const currentLives = streams.flatMap(row => {
    const presence = Array.isArray(row.live_presence) ? row.live_presence[0] : row.live_presence;
    if (row.status !== "live" || row.visibility !== "public" || !presence ||
        !["READY_AUDIO", "READY_VIDEO"].includes(presence.state) ||
        (presence.state === "READY_AUDIO" && presence.media_type !== "audio") ||
        (presence.state === "READY_VIDEO" && presence.media_type !== "video") ||
        !Number.isSafeInteger(presence.version) || presence.version < 1 ||
        !presence.session_id ||
        (row.scheduled_end_at && (!isValidDate(row.scheduled_end_at) || Date.parse(row.scheduled_end_at) <= nowMs))) {
      return [];
    }
    return [{
      id: row.id,
      hostId: row.host_id,
      title: row.title,
      category: row.category || "Community",
      roomName: row.room_name,
      viewerCount: Math.max(0, row.viewer_count ?? 0),
      startedAt: row.started_at,
      thumbnailPath: row.thumbnail_path,
      aspectRatio: row.aspect_ratio,
      mediaType: presence.media_type as "audio" | "video",
      sessionId: presence.session_id,
      version: presence.version,
      href: `/streaming/live/${row.id}`,
    }];
  });

  // A replay row is inserted only after its media upload completes in GoLive.
  // Do not fabricate archive cards from ended stream metadata alone.
  const pastLives = recordings.filter(row =>
    row.visibility === "public" && typeof row.video_path === "string" &&
    row.video_path.trim().length > 0 && isValidDate(row.created_at) &&
    typeof row.duration_seconds === "number" && row.duration_seconds > 0,
  ).map(row => ({
    id: row.id,
    title: row.title,
    category: row.category || "Community",
    durationSeconds: row.duration_seconds,
    recordedAt: row.created_at,
    thumbnailPath: row.thumbnail_path,
    mediaType: row.mime_type?.startsWith("audio/") ? "audio" as const : "video" as const,
    href: `/streaming/replay/${row.id}`,
  }));

  const scheduledLives = schedules.filter(row =>
    (row.status === "scheduled" || row.status === "waiting") &&
    isValidDate(row.starts_at) && isValidDate(row.ends_at) &&
    Date.parse(row.starts_at) < Date.parse(row.ends_at) && Date.parse(row.ends_at) > nowMs,
  ).map(row => ({
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    category: row.category || "Community",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    thumbnailPath: row.thumbnail_path,
    // Mic-only scheduled Lives may be ready without a camera.
    hostReady: Boolean(row.host_checked_in_at && row.mic_ready),
    href: "/streaming/scheduled",
  }));

  return {
    currentLives,
    audioRooms: currentLives.filter(live => live.mediaType === "audio"),
    gameStreams: currentLives.filter(live => isGameStreamCategory(live.category)),
    pastLives,
    scheduledLives,
    paths: {
      allStreams: "/streaming",
      goLive: "/streaming/go-live",
      scheduleLive: "/streaming/go-live?schedule=1",
    },
  };
}
