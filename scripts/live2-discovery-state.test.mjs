import assert from "node:assert/strict";
import test from "node:test";
import { isDiscoverableLive, shouldApplyPresenceEvent } from "../lib/live-discovery-state.ts";

const readyVideo = { session_id: "session-1", version: 3, state: "READY_VIDEO" };
const reconnecting = { session_id: "session-1", version: 4, state: "RECONNECTING" };
const ended = { session_id: "session-1", version: 5, state: "ENDED" };

test("only published audio or video is eligible for new discovery", () => {
  for (const state of ["STARTING", "RECONNECTING", "ENDED"]) assert.equal(isDiscoverableLive(state), false);
  for (const state of ["READY_AUDIO", "READY_VIDEO"]) assert.equal(isDiscoverableLive(state), true);
});

test("duplicate and delayed events cannot reverse newer state", () => {
  assert.equal(shouldApplyPresenceEvent(undefined, readyVideo), true);
  assert.equal(shouldApplyPresenceEvent(readyVideo, readyVideo), false);
  assert.equal(shouldApplyPresenceEvent(reconnecting, readyVideo), false);
  assert.equal(shouldApplyPresenceEvent(readyVideo, reconnecting), true);
});

test("terminal state cannot be resurrected by a delayed READY event", () => {
  assert.equal(shouldApplyPresenceEvent(reconnecting, ended), true);
  assert.equal(shouldApplyPresenceEvent(ended, { ...readyVideo, version: 6 }), false);
  assert.equal(shouldApplyPresenceEvent(ended, { ...readyVideo, session_id: "session-2", version: 1 }), false);
});

test("different sessions and invalid versions are rejected", () => {
  assert.equal(shouldApplyPresenceEvent(readyVideo, { ...readyVideo, session_id: "session-2", version: 4 }), false);
  assert.equal(shouldApplyPresenceEvent(undefined, { ...readyVideo, version: 0 }), false);
  assert.equal(shouldApplyPresenceEvent(undefined, { ...readyVideo, version: Number.NaN }), false);
});

test("malformed realtime state is ignored rather than affecting discovery", () => {
  assert.equal(shouldApplyPresenceEvent(undefined, { ...readyVideo, state: "INVALID" }), false);
  assert.equal(shouldApplyPresenceEvent(readyVideo, { ...readyVideo, state: "UNKNOWN", version: 9 }), false);
});
