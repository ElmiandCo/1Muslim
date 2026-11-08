import { QUESTS, type MissionProgress, type QuestObjective, type Vec3, completeObjective } from "./mission-graph";

/** Engine-independent proximity and objective interaction gate. No UI or renderer dependencies. */
export type InteractionEvent =
  | { readonly kind: "talk" | "collect" | "reach"; readonly targetId: string }
  | { readonly kind: "drive"; readonly targetId: string; readonly inVehicle: boolean; readonly cargoSecured: boolean }
  | { readonly kind: "defend"; readonly targetId: string; readonly civiliansSafe: boolean; readonly encounterResolved: boolean }
  | { readonly kind: "boss"; readonly targetId: string; readonly civiliansSafe: boolean; readonly bossDefeated: boolean };

export interface InteractionResult {
  readonly accepted: boolean;
  readonly reason: "ok" | "no-active-quest" | "wrong-target" | "out-of-range" | "requirements-not-met";
  readonly progress: MissionProgress;
  readonly objective: QuestObjective | null;
}

export function distanceXZ(a: Vec3, b: Vec3): number {
  if (![...a, ...b].every(Number.isFinite)) throw new RangeError("Non-finite world coordinate");
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

export function currentObjective(progress: MissionProgress): QuestObjective | null {
  const quest = QUESTS.find(q => q.id === progress.activeQuest);
  return quest?.objectives.find(o => !progress.completedObjectives.includes(o.id)) ?? null;
}

/** Requires a matching semantic event, proximity, and safety/mission conditions before advancing. */
export function applyInteraction(progress: MissionProgress, playerPosition: Vec3, event: InteractionEvent): InteractionResult {
  const objective = currentObjective(progress);
  if (!objective) return { accepted: false, reason: "no-active-quest", progress, objective: null };
  if (event.targetId !== objective.targetId || event.kind !== objective.kind) {
    return { accepted: false, reason: "wrong-target", progress, objective };
  }
  if (distanceXZ(playerPosition, objective.targetPosition) > objective.radiusMeters) {
    return { accepted: false, reason: "out-of-range", progress, objective };
  }
  const allowed = event.kind === "drive" ? event.inVehicle && event.cargoSecured
    : event.kind === "defend" ? event.civiliansSafe && event.encounterResolved
    : event.kind === "boss" ? event.civiliansSafe && event.bossDefeated
    : true;
  if (!allowed) return { accepted: false, reason: "requirements-not-met", progress, objective };
  return { accepted: true, reason: "ok", progress: completeObjective(progress, objective.id), objective };
}
