import assert from "node:assert/strict";
import test from "node:test";
import { summarizeHostTracks, classifyLivePresence } from "../lib/live-presence.ts";

test("viewer-only or absent host is not discoverable", () => {
  assert.equal(classifyLivePresence(summarizeHostTracks(null)), "RECONNECTING");
});
test("connected host without published media is not READY", () => {
  assert.equal(classifyLivePresence(summarizeHostTracks({ tracks: [] })), "STARTING");
});
test("published microphone makes audio-only Live discoverable", () => {
  assert.equal(classifyLivePresence(summarizeHostTracks({ tracks: [{ type: 0 }] })), "READY_AUDIO");
});
test("camera/screen track takes precedence over audio", () => {
  assert.equal(classifyLivePresence(summarizeHostTracks({ tracks: [{ type: 0 }, { type: 1 }] })), "READY_VIDEO");
});
test("video-only host is discoverable", () => {
  assert.equal(classifyLivePresence(summarizeHostTracks({ tracks: [{ type: 1 }] })), "READY_VIDEO");
});
