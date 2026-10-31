// Pure monotonic Live 2.0 event rules, independently testable without a browser.
export type Live2State = "STARTING" | "READY_AUDIO" | "READY_VIDEO" | "RECONNECTING" | "ENDED";
export type PresenceVersion = { session_id: string; state: Live2State; version: number };

export function isDiscoverableLive(state: Live2State) {
  return state === "READY_AUDIO" || state === "READY_VIDEO";
}

export function shouldApplyPresenceEvent(previous: PresenceVersion | undefined, next: PresenceVersion) {
  if (!next.session_id || !Number.isSafeInteger(next.version) || next.version < 1) return false;
  // ENDED is terminal even if a delayed READY or a reused room arrives.
  if (previous?.state === "ENDED") return false;
  if (!previous) return true;
  if (previous.session_id !== next.session_id) return false;
  return next.version > previous.version;
}
