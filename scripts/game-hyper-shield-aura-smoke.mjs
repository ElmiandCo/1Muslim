/** Game-only smoke: run with Node 22.16+ using --experimental-strip-types. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderGameShieldAura,playGameShieldAudio} from "../app/components/gameHyperShieldAura.ts";

const pos={x:5,y:2,z:-8};
const capture=(options)=>{
 const out=[];
 const count=renderGameShieldAura((...args)=>out.push(args),pos,options);
 assert.equal(count,out.length);
 return out;
};
const full={fade:1,nowMs:1000,distance:0};
const near=capture(full),mid=capture({...full,distance:38}),far=capture({...full,distance:60});
assert.equal(near.length,50,"near bubble: 36 rings + 12 facets + 2 caps");
assert.equal(mid.length,26,"medium LOD");
assert.equal(far.length,8,"far LOD");
assert.equal(capture({...full,distance:80}).length,0,"remote culling");
assert.equal(capture({...full,fade:0}).length,0,"expired shield hidden");
assert.equal(capture({...full,fade:-1}).length,0,"negative fade hidden");
assert.equal(capture({...full,fade:NaN}).length,0,"nonfinite fade hidden");
assert.equal(capture({...full,nowMs:NaN}).length,0,"nonfinite clock hidden");
assert.equal(capture({...full,distance:NaN}).length,0,"nonfinite distance hidden");
assert.ok(near.every(x=>x[7]>=0&&x[7]<=.68),"bounded alpha");
assert.ok(near.every(x=>x.slice(0,7).every((n,i)=>i===6||Number.isFinite(n))),"finite geometry");
const half=capture({...full,fade:.5});
assert.ok(half.every((x,i)=>Math.abs(x[7]-near[i][7]*.5)<1e-9),"fade applies to all facets");
const impact=capture({...full,impactAgeMs:0});
assert.ok(impact[0][0]>near[0][0],"impact briefly expands shell");
assert.equal(capture({...full,impactAgeMs:420})[0][0],near[0][0],"impact pulse ends");
assert.equal(playGameShieldAudio("impact"),false,"SSR/Node sound is safely silent");
const lobby=readFileSync(new URL("../app/components/SharedGameLobby.tsx",import.meta.url),"utf8");
for(const marker of ['renderGameShieldAura(', 'playGameShieldAudio("activate")', 'playGameShieldAudio("impact")','gameShieldRemainingMs(now,shieldUntil.current)>0','shieldRemainingMs:gameShieldRemainingMs','EGYPT_SPAWN','partedSeaWorldRef','jurassicWorldRef','futureWorldRef','meetingSeatRef','Belt Boyz']){
 assert.ok(lobby.includes(marker),"preserve wiring: "+marker);
}
assert.ok(!lobby.includes('const fade=gameShieldFade(remaining),spin='),"old 13-draw ring replaced");
console.log("PASS: Hyper Defense aura geometry, LOD, fade, impact, SSR sound and 11 lobby preservation checks");
