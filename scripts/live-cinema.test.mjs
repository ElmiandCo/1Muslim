import assert from "node:assert/strict";
import test from "node:test";
import { cinemaAudioActive, cinemaFit, cinemaKeyboardOffset } from "../lib/live-cinema.ts";
import { flipLiveCamera } from "../lib/live-cinema-camera.ts";
import { cameraCrossfadeDuration, captureCameraFreezeFrame, dissolveCameraFreezeFrame, waitForIncomingCameraFrame } from "../lib/live-camera-crossfade.ts";

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

test("frozen camera frame captures locally at bounded resolution, no media re-acquisition", () => {
  const draws = [];
  const canvas = { width: 0, height: 0, style: {}, getContext: () => ({ drawImage: (...args) => draws.push(args) }) };
  const video = { readyState: 4, videoWidth: 1920, videoHeight: 1080 };
  assert.equal(captureCameraFreezeFrame(video, canvas), true);
  assert.equal(canvas.width, 960);
  assert.equal(canvas.height, 540);
  assert.equal(draws.length, 1);
  assert.equal(draws[0][0], video);
  assert.equal(canvas.style.opacity, "1");
  assert.equal(cameraCrossfadeDuration(false), 400);
  assert.equal(cameraCrossfadeDuration(true), 0);
});

test("unavailable frame fails safely and releases canvas without leaking screenshot", async () => {
  const canvas = { width: 0, height: 0, style: { opacity: "1" }, getContext: () => { throw Error("canvas blocked"); } };
  assert.equal(captureCameraFreezeFrame({ readyState: 4, videoWidth: 640, videoHeight: 480 }, canvas), false);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.style.opacity, "0");
  await dissolveCameraFreezeFrame(canvas, 400);
  assert.equal(canvas.width, 0);
});

test("incoming frame callback gates the dissolve; reduced motion clears immediately", async () => {
  let called = false;
  const video = {
    readyState: 4, videoWidth: 720,
    requestVideoFrameCallback: cb => { setTimeout(() => { called = true; cb(); }, 1); return 1; },
    cancelVideoFrameCallback: () => {},
    removeEventListener: () => {},
  };
  assert.equal(await waitForIncomingCameraFrame(video, 100), true);
  assert.equal(called, true);
  const canvas = { width: 960, height: 540, style: { opacity: "1" } };
  await dissolveCameraFreezeFrame(canvas, 0);
  assert.equal(canvas.style.opacity, "0");
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test("camera freeze never requires a ready video element", () => {
  const canvas = { width: 0, height: 0, style: {} };
  assert.equal(captureCameraFreezeFrame(null, canvas), false);
  assert.equal(captureCameraFreezeFrame({ readyState: 1, videoWidth: 0, videoHeight: 0 }, canvas), false);
});
