/** Game Labs character asset contract. No procedural humanoid fallbacks. */
export type CharacterPresentation = "male" | "female";
export type CharacterAction =
  | "idle" | "walk" | "run" | "jump" | "dodge" | "attack"
  | "enter-vehicle" | "drive" | "hit";

export const REQUIRED_ACTIONS: readonly CharacterAction[] = [
  "idle", "walk", "run", "jump", "dodge", "attack",
  "enter-vehicle", "drive", "hit"
] as const;

export interface RiggedCharacterAsset {
  id: CharacterPresentation;
  /** An original, legally usable, skinned GLB. Never a primitive placeholder. */
  glbUrl: string;
  /** Authored clip names in the GLB, mapped to game action IDs. */
  animations: Record<CharacterAction, string>;
  /** Verified author, acquisition source and usage permission. */
  provenance: { creator: string; source: string; license: string };
  /** World convention: metres, Y up, forward -Z, ground at Y=0. */
  metersPerUnit: number;
  skeletonRoot: string;
  /** Optional performance variants of the same approved character. */
  lod?: readonly { glbUrl: string; minimumScreenHeightPx: number }[];
}

export interface CharacterValidation {
  valid: boolean;
  errors: string[];
}

/** Metadata validation only. A GLB runtime must also verify skins, bones, clips and textures. */
export function validateCharacterManifest(asset: RiggedCharacterAsset): CharacterValidation {
  const errors: string[] = [];
  if (asset.id !== "male" && asset.id !== "female") errors.push("Invalid presentation ID");
  if (!/^\/[^?#]+\.glb(?:\?[^#]*)?$/i.test(asset.glbUrl)) errors.push("GLB must be an app-local .glb URL");
  if (!asset.skeletonRoot.trim()) errors.push("Missing skeleton root");
  if (!(asset.metersPerUnit > 0 && Number.isFinite(asset.metersPerUnit))) errors.push("Invalid metre scale");
  for (const action of REQUIRED_ACTIONS) {
    if (!asset.animations[action]?.trim()) errors.push(`Missing animation mapping: ${action}`);
  }
  if (!asset.provenance.creator.trim() || !asset.provenance.source.trim() || !asset.provenance.license.trim()) {
    errors.push("Incomplete asset provenance/license");
  }
  for (const lod of asset.lod ?? []) {
    if (!/^\/[^?#]+\.glb(?:\?[^#]*)?$/i.test(lod.glbUrl) || !(lod.minimumScreenHeightPx > 0)) {
      errors.push("Invalid LOD configuration");
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Avoid rendering placeholders: both approved characters are required to enter Story Mode. */
export function canBeginStoryMode(assets: Partial<Record<CharacterPresentation, RiggedCharacterAsset>>): boolean {
  return (["male", "female"] as const).every(id =>
    assets[id]?.id === id && validateCharacterManifest(assets[id]!).valid
  );
}
