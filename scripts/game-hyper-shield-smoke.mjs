#!/usr/bin/env node
/** Run from repo root with Node >=22.16: node --experimental-strip-types scripts/game-hyper-shield-smoke.mjs */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {
 GAME_SHIELD_DURATION_MS,GAME_SHIELD_FADE_MS,gameShieldRemainingMs,gameShieldFade
} from "../app/components/gameHyperShield.ts";

let checks=0;
const equal=(actual,expected,message)=>{assert.equal(actual,expected,message);checks++};
const ok=(actual,message)=>{assert.ok(actual,message);checks++};
equal(GAME_SHIELD_DURATION_MS,10000,"Hyper Defense lasts exactly ten seconds");
equal(GAME_SHIELD_FADE_MS,3000,"Shield fades during final three seconds");
const activated=2000,expiry=activated+GAME_SHIELD_DURATION_MS;
equal(gameShieldRemainingMs(activated,expiry),10000,"Full initial duration");
equal(gameShieldRemainingMs(activated+6999,expiry),3001,"Still opaque before fade");
equal(gameShieldRemainingMs(activated+7000,expiry),3000,"Fade begins at seven seconds");
equal(gameShieldRemainingMs(activated+9999,expiry),1,"Still protected at 9.999 seconds");
equal(gameShieldRemainingMs(expiry,expiry),0,"Exactly ten seconds ends immunity");
equal(gameShieldRemainingMs(expiry+1,expiry),0,"Expired shields never revive");
equal(gameShieldRemainingMs(0,Infinity),0,"Invalid expiry cannot create permanent shield");
equal(gameShieldRemainingMs(NaN,expiry),0,"Invalid clock is rejected");
equal(gameShieldFade(3001),1,"Full shield brightness until fade window");
equal(gameShieldFade(3000),1,"Fade starts at full opacity");
equal(gameShieldFade(1500),.5,"Fade is halfway through final three seconds");
equal(gameShieldFade(1),1/3000,"Shield is almost invisible at expiry");
equal(gameShieldFade(0),0,"Expired shield invisible");
equal(gameShieldFade(NaN),0,"Invalid fade rejected");
ok(gameShieldRemainingMs(1234,11234)===GAME_SHIELD_DURATION_MS,"Duration is bounded");
const lobby=readFileSync(fileURLToPath(new URL("../app/components/SharedGameLobby.tsx",import.meta.url)),"utf8");
for(const token of [
 'import {GAME_SHIELD_DURATION_MS,gameShieldRemainingMs,gameShieldFade} from "./gameHyperShield"',
 'shieldUntil.current=now+GAME_SHIELD_DURATION_MS',
 'shieldReadyAt.current=now+(shieldLevel>=2?15000:20000)',
 'shieldRemainingMs:gameShieldRemainingMs(performance.now(),shieldUntil.current)',
 'gameShieldRemainingMs(now,shieldUntil.current)>0)return',
 'const guarded=gameShieldRemainingMs(now,shieldUntil.current)>0',
 'partedSeaState.current.invulnerableUntil=Math.max(partedSeaState.current.invulnerableUntil,shieldUntil.current)',
 'const fade=gameShieldFade(remaining)',
 'onClick={activateShield}',
 'EGYPT_COLLISION_INDEX','resolveSweptSideGameMovement',
 'renderHajjPilgrims','renderNabawiCongregation','Belt Boyz'
])ok(lobby.includes(token),"Game wiring/preservation: "+token);
ok(!lobby.includes('setShield(v=>!v)'),"Old unlimited toggle removed");
ok(!lobby.includes('shield&&Math.abs(facingDifference)'),"Old front-only shield rule removed");
console.log("PASS Hyper Defense timing, full-angle local protection, world preservation: "+checks+" assertions. No server authority or real-device playtest implied.");
