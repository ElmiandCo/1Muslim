/** Rome lion deterministic combat rules. Integration into multiplayer authoritative host is REQUIRED. */
export const ROMAN_LION_RULES = Object.freeze({
  baseSpeedMultiplier: 4,
  playerBoostMultiplier: 3,
  hitsToDefeat: 5,
  respawnDelayMs: 300_000,
  attackReach: 3.5,
  lungeCooldownMs: 1800,
});
export type LionCombatState = { hits: number; defeatedAt: number | null; lastLungeAt: number };
export const initialLionCombatState = (): LionCombatState => ({ hits: 0, defeatedAt: null, lastLungeAt: -Infinity });
/** Call ONLY on the authoritative combat host after validating a projectile collision. */
export function registerConfirmedLionHit(state: LionCombatState, nowMs: number): LionCombatState {
  if (state.defeatedAt !== null) return state;
  const hits = Math.min(ROMAN_LION_RULES.hitsToDefeat, state.hits + 1);
  return { ...state, hits, defeatedAt: hits === ROMAN_LION_RULES.hitsToDefeat ? nowMs : null };
}
export function advanceLionRespawn(state: LionCombatState, nowMs: number): LionCombatState {
  return state.defeatedAt !== null && nowMs - state.defeatedAt >= ROMAN_LION_RULES.respawnDelayMs
    ? initialLionCombatState() : state;
}
export function canLionLunge(state: LionCombatState, nowMs: number, distance: number): boolean {
  return state.defeatedAt === null && distance <= ROMAN_LION_RULES.attackReach
    && nowMs - state.lastLungeAt >= ROMAN_LION_RULES.lungeCooldownMs;
}
export function lionGroundVelocity(dx: number, dz: number, baseSpeed: number) {
  const length = Math.hypot(dx, dz);
  return length > 0 ? { x: dx / length * baseSpeed * ROMAN_LION_RULES.baseSpeedMultiplier,
    y: 0, z: dz / length * baseSpeed * ROMAN_LION_RULES.baseSpeedMultiplier } : { x: 0, y: 0, z: 0 };
}
