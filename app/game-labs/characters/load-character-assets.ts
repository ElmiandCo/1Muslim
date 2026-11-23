import { verifyCharacterAsset, storyModeAssetGate, type CharacterAssetReadiness } from "./asset-readiness";
import type { CharacterPresentation, RiggedCharacterAsset } from "./character-contract";

export const MAX_CHARACTER_GLB_BYTES = 32 * 1024 * 1024;
export type CharacterLoadState = { status: "ready" | "unavailable"; assets: Record<CharacterPresentation, CharacterAssetReadiness>; errors: string[] };
type FetchLike = (url: string, init: { signal?: AbortSignal; cache: "no-store" }) => Promise<Pick<Response, "ok" | "status" | "headers" | "arrayBuffer">>;

/** Fetch and inspect BOTH original skinned GLBs; never synthesize a humanoid fallback.
 * A successful preflight is not proof of runtime GPU skinning, art quality or legal rights.
 */
export async function loadStoryModeCharacters(
  manifests: Record<CharacterPresentation, RiggedCharacterAsset>,
  options: { fetcher?: FetchLike; signal?: AbortSignal; maxBytes?: number } = {},
): Promise<CharacterLoadState> {
  const fetcher = options.fetcher ?? fetch;
  const maxBytes = options.maxBytes ?? MAX_CHARACTER_GLB_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("Invalid GLB size budget");
  const load = async (id: CharacterPresentation): Promise<CharacterAssetReadiness> => {
    const asset = manifests[id];
    // Reject unsafe paths before requesting bytes, even if a manifest has a valid extension.
    if (!asset || asset.id !== id || !/^\/(?!\/)[a-zA-Z0-9_./-]+\.glb$/.test(asset.glbUrl) || asset.glbUrl.split("/").includes("..")) {
      return { id, ready: false, inspection: null, errors: ["Invalid or missing local character GLB path"] };
    }
    try {
      const response = await fetcher(asset.glbUrl, { signal: options.signal, cache: "no-store" });
      if (!response.ok) return { id, ready: false, inspection: null, errors: [`GLB fetch failed: HTTP ${response.status}`] };
      const declared = response.headers.get("content-length");
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
        return { id, ready: false, inspection: null, errors: ["GLB exceeds download budget"] };
      }
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > maxBytes) {
        return { id, ready: false, inspection: null, errors: ["GLB missing or exceeds download budget"] };
      }
      return verifyCharacterAsset(asset, bytes);
    } catch (error) {
      return { id, ready: false, inspection: null, errors: [options.signal?.aborted ? "GLB loading cancelled" : `GLB fetch failed: ${error instanceof Error ? error.message : "unknown error"}`] };
    }
  };
  const [male, female] = await Promise.all([load("male"), load("female")]);
  const assets = { male, female };
  const gate = storyModeAssetGate(assets);
  return { status: gate.ready ? "ready" : "unavailable", assets, errors: [...male.errors, ...female.errors, ...gate.errors] };
}
