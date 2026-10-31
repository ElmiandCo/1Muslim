// Server-only LiveKit participant snapshot classification.
// LiveKit protobuf TrackType: AUDIO=0, VIDEO=1.
export type LivePresenceState = "STARTING" | "READY_AUDIO" | "READY_VIDEO" | "RECONNECTING" | "ENDED";
export type HostTrack = { type?: number | string; muted?: boolean };
export type HostSnapshot = { tracks?: readonly HostTrack[] } | null | undefined;

export function summarizeHostTracks(host: HostSnapshot) {
  const tracks = (host?.tracks ?? []).filter(track => track.muted !== true);
  return {
    hostConnected: Boolean(host),
    hasAudio: tracks.some(track => track.type === 0 || track.type === "AUDIO"),
    hasVideo: tracks.some(track => track.type === 1 || track.type === "VIDEO"),
  };
}

export function classifyLivePresence(snapshot: ReturnType<typeof summarizeHostTracks>): LivePresenceState {
  if (!snapshot.hostConnected) return "RECONNECTING";
  if (snapshot.hasVideo) return "READY_VIDEO";
  if (snapshot.hasAudio) return "READY_AUDIO";
  return "STARTING";
}
