import test from "node:test";
import assert from "node:assert/strict";
import { initialCharacterSelectState, transitionCharacterSelect } from "../app/game-labs/characters/character-selection-state.ts";

const valid = id => ({ id, ready: true, inspection: { valid: true, errors: [] }, errors: [] });
const loaded = { status: "ready", assets: { male: valid("male"), female: valid("female") }, errors: [] };

test("select female then begin cinematic and play only with both validated rigs", () => {
  const selected = transitionCharacterSelect(initialCharacterSelectState, { type: "select", presentation: "female" });
  assert.equal(selected.selected, "female");
  const intro = transitionCharacterSelect(selected, { type: "begin", assets: loaded });
  assert.equal(intro.phase, "intro");
  assert.equal(transitionCharacterSelect(intro, { type: "intro-complete" }).phase, "playing");
  assert.equal(transitionCharacterSelect(intro, { type: "select", presentation: "male" }).selected, "female");
});

test("reject missing second rig even if loader reports ready", () => {
  const bad = { ...loaded, assets: { male: valid("male") } };
  const result = transitionCharacterSelect(initialCharacterSelectState, { type: "begin", assets: bad });
  assert.equal(result.phase, "select");
  assert.match(result.error, /female/);
});

test("reject unavailable assets and prevent skipping intro", () => {
  const unavailable = { ...loaded, status: "unavailable", errors: ["missing original GLB"] };
  assert.match(transitionCharacterSelect(initialCharacterSelectState, { type: "begin", assets: unavailable }).error, /missing original GLB/);
  assert.equal(transitionCharacterSelect(initialCharacterSelectState, { type: "intro-complete" }).phase, "select");
});

test("returning to selection clears errors and preserves presentation", () => {
  const state = { selected: "female", phase: "playing", error: "old" };
  assert.deepEqual(transitionCharacterSelect(state, { type: "return-to-select" }), { selected: "female", phase: "select", error: null });
});
