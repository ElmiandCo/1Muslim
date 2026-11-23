import type { CharacterAction } from "./character-contract";

/** Engine-independent character action selection. Never manipulates a renderer or a skeleton. */
export interface CharacterMotionInput {
  grounded: boolean;
  horizontalSpeedMetersPerSecond: number;
  inVehicle: boolean;
  enteringVehicle: boolean;
  jumping: boolean;
  dodging: boolean;
  attacking: boolean;
  takingHit: boolean;
}

export type AnimationDecision = {
  action: CharacterAction;
  loop: boolean;
  crossFadeSeconds: number;
};

const ONE_SHOTS: readonly CharacterAction[] = ["jump", "dodge", "attack", "enter-vehicle", "hit"];

/** Highest-priority reactions win. Vehicle driving never accidentally triggers walk/run. */
export function selectCharacterAnimation(input: CharacterMotionInput): AnimationDecision {
  if (!Number.isFinite(input.horizontalSpeedMetersPerSecond) || input.horizontalSpeedMetersPerSecond < 0) {
    throw new RangeError("Character speed must be a finite nonnegative number");
  }
  let action: CharacterAction;
  if (input.takingHit) action = "hit";
  else if (input.enteringVehicle) action = "enter-vehicle";
  else if (input.inVehicle) action = "drive";
  else if (input.dodging) action = "dodge";
  else if (input.attacking) action = "attack";
  else if (input.jumping || !input.grounded) action = "jump";
  else if (input.horizontalSpeedMetersPerSecond >= 3.2) action = "run";
  else if (input.horizontalSpeedMetersPerSecond >= 0.15) action = "walk";
  else action = "idle";
  return { action, loop: !ONE_SHOTS.includes(action), crossFadeSeconds: action === "hit" ? 0.08 : 0.18 };
}

/** Check actual GLB clip names after parsing the GLB, not just manifest metadata. */
export function validateLoadedAnimationClips(
  mapping: Record<CharacterAction, string>,
  availableClipNames: readonly string[],
): { valid: boolean; missing: CharacterAction[]; duplicates: string[] } {
  const clips = new Set(availableClipNames);
  const actions: CharacterAction[] = ["idle", "walk", "run", "jump", "dodge", "attack", "enter-vehicle", "drive", "hit"];
  const missing = actions.filter(action => !mapping[action] || !clips.has(mapping[action]));
  const counts = new Map<string, number>();
  for (const action of actions) {
    const name = mapping[action];
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([name]) => name);
  return { valid: missing.length === 0 && duplicates.length === 0, missing, duplicates };
}
