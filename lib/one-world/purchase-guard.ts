/**
 * ONE WORLD V1: pure, fail-closed purchase validation.
 * This is NOT a wallet transaction. Only a trusted server-side DB transaction may
 * call this after locking wallet and plot rows and checking authenticated identity.
 */
export type Plot = Readonly<{ id: string; regionId: string; x: number; y: number; ownerId: string | null }>;
export type PurchaseRequest = Readonly<{
  actorId: string;
  target: Plot;
  ownedPlots: readonly Plot[];
  walletXp: number;
  costXp: number;
  idempotencyKey: string;
}>;
export type PurchaseValidation = { ok: true } | { ok: false; reason: string };

export function validateAdjacentPurchase(input: PurchaseRequest): PurchaseValidation {
  if (!input || typeof input !== "object") return { ok: false, reason: "INVALID_REQUEST" };
  const { actorId, target, ownedPlots, walletXp, costXp, idempotencyKey } = input;
  if (typeof actorId !== "string" || !actorId.trim() || typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 128) return { ok: false, reason: "INVALID_IDENTITY_OR_KEY" };
  if (!target || typeof target.id !== "string" || !target.id.trim() || typeof target.regionId !== "string" || !target.regionId.trim() || !Number.isSafeInteger(target.x) || !Number.isSafeInteger(target.y))
    return { ok: false, reason: "INVALID_TARGET" };
  if (target.ownerId !== null) return { ok: false, reason: "ALREADY_OWNED" };
  if (!Number.isSafeInteger(walletXp) || walletXp < 0 || !Number.isSafeInteger(costXp) || costXp <= 0)
    return { ok: false, reason: "INVALID_WALLET_OR_COST" };
  if (walletXp < costXp) return { ok: false, reason: "INSUFFICIENT_XP" };
  if (!Array.isArray(ownedPlots)) return { ok: false, reason: "INVALID_OWNERSHIP_DATA" };
  const adjacent = ownedPlots.some(plot =>
    plot != null &&
    plot.ownerId === actorId &&
    plot.regionId === target.regionId &&
    Number.isSafeInteger(plot.x) && Number.isSafeInteger(plot.y) &&
    Math.abs(plot.x - target.x) + Math.abs(plot.y - target.y) === 1
  );
  return adjacent ? { ok: true } : { ok: false, reason: "NOT_ADJACENT" };
}
