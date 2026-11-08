import { inspectCharacterGlb, type GlbInspection } from "./glb-inspector";
import { validateCharacterManifest, type CharacterPresentation, type RiggedCharacterAsset } from "./character-contract";

/** Asset bytes are verified before selection is allowed. No primitive fallback. */
export type CharacterAssetReadiness = {
  id: CharacterPresentation;
  ready: boolean;
  inspection: GlbInspection | null;
  errors: string[];
};

export function verifyCharacterAsset(
  asset: RiggedCharacterAsset,
  bytes: ArrayBuffer | null,
): CharacterAssetReadiness {
  const manifest = validateCharacterManifest(asset);
  const errors = [...manifest.errors];
  let inspection: GlbInspection | null = null;
  if (!bytes) errors.push("Rigged GLB bytes have not been loaded");
  else {
    inspection = inspectCharacterGlb(bytes, asset.animations);
    errors.push(...inspection.errors);
  }
  return { id: asset.id, ready: errors.length === 0, inspection, errors };
}

/** Both presentations must be inspected and valid before Begin Story Mode unlocks.
 * Does not claim GPU playback, visual quality, provenance audit or measured FPS.
 */
export function storyModeAssetGate(
  assets: Partial<Record<CharacterPresentation, CharacterAssetReadiness>>,
): { ready: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const id of ["male", "female"] as const) {
    const entry = assets[id];
    if (!entry || entry.id !== id || !entry.ready || !entry.inspection?.valid) {
      errors.push(`Validated ${id} rigged GLB is required`);
    }
  }
  return { ready: errors.length === 0, errors };
}
