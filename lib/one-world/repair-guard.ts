/** Pure V1 repair authorization; never debits XP or writes durability. Caller must load
 * authenticated actor, wallet, plot and building under a database transaction/locks.
 * Costs and maximum durability must be server-derived, not supplied by a browser.
 */
export type RepairInput = Readonly<{
  actorId: string; idempotencyKey: string; plotOwnerId: string | null;
  buildingId: string; durability: number; maxDurability: number;
  walletXp: number; costXp: number;
}>;
export type RepairDecision = {ok:true} | {ok:false;reason:string};
export function validateRepair(input: RepairInput): RepairDecision {
  if (!input || typeof input !== "object") return {ok:false,reason:"INVALID_REQUEST"};
  const {actorId,idempotencyKey,plotOwnerId,buildingId,durability,maxDurability,walletXp,costXp}=input;
  if (typeof actorId!=="string" || !actorId.trim() || typeof idempotencyKey!=="string" || !idempotencyKey.trim() || idempotencyKey.length>128)
    return {ok:false,reason:"INVALID_IDENTITY_OR_KEY"};
  if (typeof buildingId!=="string" || !buildingId.trim()) return {ok:false,reason:"INVALID_BUILDING"};
  if (plotOwnerId!==actorId) return {ok:false,reason:"NOT_OWNER"};
  if (![durability,maxDurability,walletXp,costXp].every(Number.isSafeInteger) || maxDurability<=0 || durability<0 || durability>maxDurability || walletXp<0 || costXp<=0)
    return {ok:false,reason:"INVALID_STATE_OR_COST"};
  if (durability===maxDurability) return {ok:false,reason:"ALREADY_FULL"};
  if (walletXp<costXp) return {ok:false,reason:"INSUFFICIENT_XP"};
  return {ok:true};
}
