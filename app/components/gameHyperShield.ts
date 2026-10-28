/**
 * Hyper Defense shield timing shared by combat and the lightweight visual renderer.
 * Use a single monotonic clock (performance.now) per client; never trust peer
 * clocks or let a visual animation extend the ten-second damage window.
 */
export const GAME_SHIELD_DURATION_MS=10_000;
export const GAME_SHIELD_FADE_MS=3_000;

export function gameShieldRemainingMs(now:number,expiresAt:number):number{
 if(!Number.isFinite(now)||!Number.isFinite(expiresAt))return 0;
 return Math.max(0,Math.min(GAME_SHIELD_DURATION_MS,expiresAt-now));
}

/** Last three seconds become progressively translucent, but protection lasts
 * until the exact expiry. Zero opacity always means zero protection. */
export function gameShieldFade(remainingMs:number):number{
 if(!Number.isFinite(remainingMs)||remainingMs<=0)return 0;
 return Math.max(0,Math.min(1,remainingMs/GAME_SHIELD_FADE_MS));
}
