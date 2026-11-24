import assert from "node:assert/strict";
import test from "node:test";
import { watchHeroPreview } from "../app/deepwatch/hero-preview.ts";

function fixture(options = {}) {
  const listeners = new Map();
  const timers = new Map();
  const calls = [];
  let nextId = 1;
  function emitter(key, values = {}) {
    return {
      ...values,
      addEventListener(event, handler) { listeners.set(key + ":" + event, handler); },
      removeEventListener(event, handler) {
        if (listeners.get(key + ":" + event) === handler) listeners.delete(key + ":" + event);
      },
    };
  }
  const env = {
    document: emitter("document", { visibilityState: options.visibilityState ?? "visible" }),
    motion: emitter("motion", { matches: options.reducedMotion ?? false }),
    connection: emitter("connection", { saveData: options.saveData ?? false, effectiveType: options.effectiveType ?? "4g" }),
    setTimeout(callback, ms) { const id = nextId++; timers.set(id, { callback, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  return {
    env, calls, timers, listeners,
    notify(key) { listeners.get(key)?.(); },
    advance() { for (const [id, entry] of [...timers]) { timers.delete(id); entry.callback(); } },
    watch(enabled = true) { return watchHeroPreview(env, enabled, visible => calls.push(visible)); },
  };
}

test("hero preview loads only after a deferred, visible, opted-in interval", () => {
  const f = fixture();
  const dispose = f.watch();
  assert.deepEqual(f.calls, [false]);
  assert.equal(f.timers.size, 1);
  assert.equal([...f.timers.values()][0].ms, 4500);
  f.advance();
  assert.deepEqual(f.calls, [false, true]);
  dispose();
  assert.equal(f.listeners.size, 0);
});

test("background tabs cancel pending embeds, and navigation back defers again", () => {
  const f = fixture();
  const dispose = f.watch();
  f.env.document.visibilityState = "hidden";
  f.notify("document:visibilitychange");
  assert.deepEqual(f.calls, [false, false]);
  assert.equal(f.timers.size, 0);
  f.env.document.visibilityState = "visible";
  f.notify("document:visibilitychange");
  assert.equal(f.timers.size, 1);
  dispose();
  f.advance();
  assert.ok(f.calls.every(visible => visible === false));
});

test("reduced motion, data saving and slow connections all keep the embed unloaded", () => {
  for (const options of [{ reducedMotion: true }, { saveData: true }, { effectiveType: "2g" }, { effectiveType: "slow-2g" }]) {
    const f = fixture(options);
    const dispose = f.watch();
    f.advance();
    assert.deepEqual(f.calls, [false], JSON.stringify(options));
    assert.equal(f.timers.size, 0, JSON.stringify(options));
    dispose();
  }
});

test("toggling save-data or reduced motion unloads a visible embed immediately", () => {
  const f = fixture();
  const dispose = f.watch();
  f.advance();
  assert.equal(f.calls.at(-1), true);
  f.env.connection.saveData = true;
  f.notify("connection:change");
  assert.equal(f.calls.at(-1), false);
  assert.equal(f.timers.size, 0);
  f.env.connection.saveData = false;
  f.env.motion.matches = true;
  f.notify("motion:change");
  assert.equal(f.timers.size, 0);
  f.env.motion.matches = false;
  f.notify("motion:change");
  assert.equal(f.timers.size, 1);
  dispose();
  assert.equal(f.timers.size, 0);
  assert.equal(f.listeners.size, 0);
});
