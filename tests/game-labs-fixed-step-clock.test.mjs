import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixedStepClock } from '../app/game-labs/world/fixed-step-clock.ts';
test('advances deterministic fixed simulation ticks', () => {
  const c = createFixedStepClock(60);
  let total = 0;
  const a = c.advance(1/30, dt => total += dt);
  assert.equal(a.steps, 2);
  assert.ok(Math.abs(total-1/30) < 1e-9);
});
test('caps catchup and reports dropped simulation time', () => {
  const c = createFixedStepClock(60, 3);
  const a = c.advance(1, () => {});
  assert.equal(a.steps, 3);
  assert.ok(a.droppedSeconds > 0.9);
});
test('reset clears fractional remainder and invalid input throws', () => {
  const c = createFixedStepClock();
  c.advance(1/120, () => {});
  c.reset();
  assert.equal(c.advance(1/120, () => {}).steps, 0);
  assert.throws(() => c.advance(-1, () => {}), RangeError);
});
