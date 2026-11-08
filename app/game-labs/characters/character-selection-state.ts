import { storyModeAssetGate } from "./asset-readiness";
import type { CharacterPresentation } from "./character-contract";
import type { CharacterLoadState } from "./load-character-assets";

/** Preview-only, deterministic selection flow. Never bypass GLB validation. */
export type CharacterSelectState = {
  selected: CharacterPresentation;
  phase: "select" | "intro" | "playing";
  error: string | null;
};

export type CharacterSelectEvent =
  | { type: "select"; presentation: CharacterPresentation }
  | { type: "begin"; assets: CharacterLoadState }
  | { type: "intro-complete" }
  | { type: "return-to-select" };

export const initialCharacterSelectState: CharacterSelectState = {
  selected: "male", phase: "select", error: null,
};

export function transitionCharacterSelect(
  state: CharacterSelectState,
  event: CharacterSelectEvent,
): CharacterSelectState {
  if (event.type === "return-to-select") return { ...state, phase: "select", error: null };
  if (event.type === "select") {
    if (state.phase !== "select" || (event.presentation !== "male" && event.presentation !== "female")) return state;
    return { selected: event.presentation, phase: "select", error: null };
  }
  if (event.type === "begin") {
    if (state.phase !== "select") return state;
    const gate = storyModeAssetGate(event.assets.assets);
    if (event.assets.status !== "ready" || !gate.ready) {
      return { ...state, error: [...event.assets.errors, ...gate.errors].join("; ") || "Character assets unavailable" };
    }
    return { ...state, phase: "intro", error: null };
  }
  if (event.type === "intro-complete" && state.phase === "intro") return { ...state, phase: "playing" };
  return state;
}
