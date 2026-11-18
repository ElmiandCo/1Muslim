/** Pure validation gates. The server must recheck these against authenticated DB state. */
export const RAID_COOLDOWN_MS = 10 * 60 * 1000;
export function canAttack({attacker, defender, now = Date.now(), lastAttackAt = null}) {
  if (!attacker || !defender || attacker.id === defender.id) return {allowed:false,reason:"invalid_target"};
  if (attacker.mode !== "conquest" || defender.mode !== "conquest") return {allowed:false,reason:"peaceful_protection"};
  if (lastAttackAt !== null && (!Number.isFinite(lastAttackAt) || now - lastAttackAt < RAID_COOLDOWN_MS)) return {allowed:false,reason:"raid_cooldown"};
  return {allowed:true,reason:"eligible"};
}
export function validateRepair({ownerId, actorId, durability, maxDurability, repairPoints, xpCost, xpBalance}) {
  if (!ownerId || ownerId !== actorId) return {allowed:false,reason:"not_owner"};
  if (![durability,maxDurability,repairPoints,xpCost,xpBalance].every(Number.isSafeInteger)) return {allowed:false,reason:"invalid_amount"};
  if (maxDurability <= 0 || durability < 0 || durability > maxDurability || repairPoints <= 0 || xpCost < 0 || xpBalance < 0) return {allowed:false,reason:"invalid_amount"};
  if (durability === maxDurability || repairPoints > maxDurability-durability) return {allowed:false,reason:"invalid_repair"};
  if (xpCost > xpBalance) return {allowed:false,reason:"insufficient_xp"};
  return {allowed:true,reason:"eligible"};
}
export function battleWalletDelta() { return 0; }
