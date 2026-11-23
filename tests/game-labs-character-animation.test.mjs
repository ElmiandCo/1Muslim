import test from "node:test";
import assert from "node:assert/strict";
import { selectCharacterAnimation, validateLoadedAnimationClips } from "../app/game-labs/characters/animation-controller.ts";

const base = { grounded: true, horizontalSpeedMetersPerSecond: 0, inVehicle: false, enteringVehicle: false, jumping: false, dodging: false, attacking: false, takingHit: false };
test("idle/walk/run thresholds and jump", () => {
  assert.equal(selectCharacterAnimation(base).action, "idle");
  assert.equal(selectCharacterAnimation({ ...base, horizontalSpeedMetersPerSecond: 0.2 }).action, "walk");
  assert.equal(selectCharacterAnimation({ ...base, horizontalSpeedMetersPerSecond: 3.2 }).action, "run");
  assert.equal(selectCharacterAnimation({ ...base, grounded: false }).action, "jump");
});
test("vehicle transition and damage precedence", () => {
  assert.equal(selectCharacterAnimation({ ...base, inVehicle: true, horizontalSpeedMetersPerSecond: 10 }).action, "drive");
  assert.equal(selectCharacterAnimation({ ...base, enteringVehicle: true, inVehicle: true }).action, "enter-vehicle");
  assert.equal(selectCharacterAnimation({ ...base, takingHit: true, enteringVehicle: true }).action, "hit");
  assert.equal(selectCharacterAnimation({ ...base, dodging: true }).loop, false);
  assert.throws(() => selectCharacterAnimation({ ...base, horizontalSpeedMetersPerSecond: NaN }), RangeError);
});
test("actual clip name validation rejects missing and reused clips", () => {
  const actions = ["idle", "walk", "run", "jump", "dodge", "attack", "enter-vehicle", "drive", "hit"];
  const mapping = Object.fromEntries(actions.map(x => [x, x]));
  assert.equal(validateLoadedAnimationClips(mapping, actions).valid, true);
  assert.deepEqual(validateLoadedAnimationClips(mapping, ["idle"]).missing, actions.slice(1));
  assert.deepEqual(validateLoadedAnimationClips({ ...mapping, drive: "idle" }, actions).duplicates, ["idle"]);
});
