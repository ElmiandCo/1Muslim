import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const host = readFileSync("app/streaming/go-live/page.tsx", "utf8");
const viewer = readFileSync("components/LiveKitViewer.tsx", "utf8");
const theater = readFileSync("components/LiveCinemaTheater.tsx", "utf8");
const chat = readFileSync("components/LiveChat.tsx", "utf8");

test("camera flip uses published track replacement without disconnect or unpublish", () => {
  const flip = host.split("const flipCamera = async () => {")[1]?.split("// Use available browser network hints")[0];
  assert.ok(flip, "host camera-flip handler must exist");
  assert.match(flip, /flipLiveCamera\(/);
  assert.match(flip, /cameraFlipInFlightRef/);
  assert.doesNotMatch(flip, /\.disconnect\(|unpublishTrack|publishTrack\(/);
  assert.match(host, /playLiveCinemaMorphSound\(mode\)/);
});
test("viewer mode morph does not restart room or re-subscribe", () => {
  assert.match(viewer, /onViewModeChange\?\.\(mode\)/);
  assert.match(viewer, /\}, \[roomName, retryAttempt\]\)/);
  assert.match(theater, /transition:top 2s/);
  assert.match(theater, /data-cinema-mode="phone"/);
  assert.match(theater, /data-cinema-mode="desktop"/);
  assert.match(theater, /object-fit:cover!important/);
  assert.match(theater, /object-fit:contain!important/);
});
test("reflected background is a canvas sampling existing video, not another player", () => {
  assert.match(viewer, /<canvas ref=\{reflectionRef\}/);
  assert.match(viewer, /ctx\.drawImage\(source/);
  assert.equal((viewer.match(/<video\s/g) ?? []).length, 2, "only existing camera and screen videos");
});
test("full-screen phone comments retain keyboard-safe input, send and scroll", () => {
  assert.match(theater, /visualViewport/);
  assert.match(theater, /safe-area-inset-bottom/);
  assert.match(theater, /--cinema-keyboard-offset/);
  assert.match(theater, /<LiveChat streamId=\{streamId\}/);
  assert.match(theater, /\.messages\{min-height:0;overflow-y:auto/);
  assert.match(theater, /font-size:16px!important;min-height:44px/);
  assert.match(chat, /<form className="composer" onSubmit=\{send\}>/);
  assert.match(chat, /type="submit"/);
});
test("audio preference, gesture fallback and red/green indicator remain connected to playback", () => {
  assert.match(viewer, /localStorage\.getItem\("1muslim:live-audio-enabled"\)/);
  assert.match(viewer, /localStorage\.setItem\("1muslim:live-audio-enabled"/);
  assert.match(viewer, /cinemaAudioActive\(/);
  assert.match(viewer, /data-audible=\{audible\?"yes":"no"\}/);
  assert.match(viewer, /setAudioNeedsGesture\(true\)/);
});
test("reduced motion and iPhone safe-area support", () => {
  assert.match(theater, /prefers-reduced-motion:reduce/);
  assert.match(theater, /env\(safe-area-inset-bottom\)/);
});
