/** Shared deterministic coordinates for Nova's Jurassic reality. */
export const JURASSIC_BOUNDS = { minX: -340, maxX: 340, minZ: -340, maxZ: 340 } as const;
export const jurassicTerrain = (x: number, z: number) => .06 * Math.sin(x * .025) * Math.cos(z * .024);
export const jurassicWaterAt = (x: number, z: number) => Math.abs(z - (75 + Math.sin(x * .018) * 18)) < 12;
