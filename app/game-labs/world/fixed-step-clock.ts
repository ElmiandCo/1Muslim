/** Preview-only fixed-step simulation clock. Renderer-neutral; no production entrypoint imports. */
export interface FrameAdvance { steps: number; alpha: number; droppedSeconds: number }
export interface FixedStepClock { advance(elapsedSeconds: number, update: (dt: number) => void): FrameAdvance; reset(): void }
export function createFixedStepClock(hz = 60, maxSteps = 5): FixedStepClock {
  if (!Number.isFinite(hz) || hz <= 0 || hz > 240 || !Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 20) throw new RangeError("Invalid simulation clock settings");
  const dt = 1 / hz;
  let accumulator = 0;
  return {
    advance(elapsedSeconds, update) {
      if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) throw new RangeError("Invalid elapsed time");
      const bounded = Math.min(elapsedSeconds, 0.25);
      const droppedSeconds = Math.max(0, elapsedSeconds - bounded);
      accumulator += bounded;
      let steps = 0;
      while (accumulator + 1e-10 >= dt && steps < maxSteps) {
        update(dt);
        accumulator -= dt;
        steps++;
      }
      let extraDropped = 0;
      if (accumulator >= dt) {
        const remainder = accumulator % dt;
        extraDropped = accumulator - remainder;
        accumulator = remainder;
      }
      return { steps, alpha: Math.max(0, Math.min(1, accumulator / dt)), droppedSeconds: droppedSeconds + extraDropped };
    },
    reset() { accumulator = 0; }
  };
}
