import assert from "node:assert/strict";
import test from "node:test";
import { cinemaAudioActive, cinemaFit, cinemaKeyboardOffset } from "../lib/live-cinema.ts";
import { flipLiveCamera } from "../lib/live-cinema-camera.ts";

test("phone fills and crops, desktop restores complete image", () => {
  assert.equal(cinemaFit("phone"), "cover");
  assert.equal(cinemaFit("desktop"), "contain");
});
test("keyboard offset respects visual viewport and clamps invalid inputs", () => {
  assert.equal(cinemaKeyboardOffset(844, 500, 0), 344);
  assert.equal(cinemaKeyboardOffset(844, 500, 30), 314);
  assert.equal(cinemaKeyboardOffset(844, 844, 0), 0);
  assert.equal(cinemaKeyboardOffset(844, Number.NaN, 0), 0);
});
test("green audio only when connected and successfully playing unmuted remote audio", () => {
  assert.equal(cinemaAudioActive(true, true, false, false, true), true);
  for (let i = 0; i < 5; i++) {
    const flags = [true, true, false, false, true];
    flags[i] = !flags[i];
    assert.equal(cinemaAudioActive(...flags), false);
  }
});
function track(id) {
  return { id, kind: "video", readyState: "live", stopped: false, stop() { this.stopped = true; this.readyState = "ended"; } };
}
function stream(video, mic) {
  const tracks = [video, mic];
  return {
    getVideoTracks: () => tracks.filter(t => t.kind === "video"),
    getAudioTracks: () => tracks.filter(t => t.kind === "audio"),
    removeTrack: t => tracks.splice(tracks.indexOf(t), 1),
    addTrack: t => tracks.push(t),
  };
}
test("published camera flip retains mic and publication, no room disconnect or unpublish", async () => {
  const before = track("front");
  const mic = { id: "mic", kind: "audio" };
  const media = stream(before, mic);
  let restarts = 0;
  const publication = { mediaStreamTrack: before, async restartTrack(options) {
    assert.equal(options.facingMode, "environment");
    this.mediaStreamTrack = track("back"); restarts++;
  }};
  const next = await flipLiveCamera(media, publication, "user", "environment", { width: 720, height: 1280 }, async () => { throw Error("must not call getUserMedia"); });
  assert.equal(restarts, 1);
  assert.equal(next.id, "back");
  assert.equal(media.getAudioTracks()[0], mic);
  assert.equal(media.getVideoTracks().length, 1);
  assert.equal(before.stopped, true);
});
test("Safari preview fallback releases old camera without touching mic", async () => {
  const before = track("front"), mic = { id: "mic", kind: "audio" };
  const media = stream(before, mic);
  let attempts = 0;
  await flipLiveCamera(media, undefined, "user", "environment", { width: 720, height: 1280 }, async () => {
    attempts++;
    if (attempts === 1) throw Error("camera busy");
    return { getVideoTracks: () => [track("back")] };
  });
  assert.equal(attempts, 2);
  assert.equal(before.stopped, true);
  assert.equal(media.getAudioTracks()[0], mic);
  assert.equal(media.getVideoTracks()[0].id, "back");
});
test("published flip failure attempts original camera restoration", async () => {
  const before = track("front"), mic = { id: "mic", kind: "audio" };
  const media = stream(before, mic);
  const modes = [];
  const publication = { mediaStreamTrack: before, async restartTrack(options) {
    modes.push(options.facingMode);
    if (options.facingMode === "environment") throw Error("rear unavailable");
    this.mediaStreamTrack = track("front-restored");
  }};
  await assert.rejects(flipLiveCamera(media, publication, "user", "environment", { width: 720, height: 1280 }, async () => { throw Error("no"); }), /rear unavailable/);
  assert.deepEqual(modes, ["environment", "user"]);
  assert.equal(media.getAudioTracks()[0], mic);
  assert.equal(media.getVideoTracks()[0].id, "front-restored");
});
