// Run from repository root: node scripts/game-lunar-research-smoke.mjs
// Loads the real TypeScript module with the existing dev dependency; no mock implementation.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import ts from "typescript";

const source=readFileSync(resolve("app/components/LunarResearchScene.ts"),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {renderLunarResearchLife}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const capture=(x,z,now=0)=>{
  const calls=[];
  renderLunarResearchLife((...args)=>calls.push(args),now,x,z);
  return calls;
};
const near=capture(0,0);
const far=capture(2000,2000);
assert.equal(far.length,0,"Faraway lunar research props must be fully culled");
assert(near.length>=24,"Approach beacons must be visible near the lander");
assert(near.length<90,"Near-lunar research additions must respect the mobile draw budget");
for(const args of [...near,...capture(100,50),...capture(-125,-90)]){
  assert(args.slice(0,7).every(v=>typeof v==="number"||Array.isArray(v)));
  assert(args.slice(0,6).every(Number.isFinite),"Every position and size must be finite");
  assert(args.slice(3,6).every(v=>v>0),"Geometry dimensions must be positive");
  assert(args[6].length===3&&args[6].every(v=>Number.isFinite(v)&&v>=0&&v<=1),"RGB must be valid");
}
const solar0=capture(100,50,0),solar1=capture(100,50,9000);
assert(solar0.length>near.length/2,"Solar field must be populated");
assert.notDeepEqual(solar0,solar1,"Solar tracking / rover positions must animate");
const rover0=capture(120,96,0),rover1=capture(120,96,3000);
assert.notDeepEqual(rover0,rover1,"Survey rover movement must animate");
const lobby=readFileSync(resolve("app/components/SharedGameLobby.tsx"),"utf8");
assert.equal((lobby.match(/renderLunarResearchLife\(/g)||[]).length,1,"Render helper must be invoked once");
const moon=lobby.indexOf("    if(moonModeRef.current.landed){");
const call=lobby.indexOf("      renderLunarResearchLife(");
const ship=lobby.indexOf("    if(ship.current.inSpace){const elapsed=",moon);
assert(moon>=0&&call>moon&&ship>call,"Moon-only render dispatch must remain gated");
for(const preserved of ["renderPartedSea","renderRomanJudea","drawJurassic","renderFutureWorld","createTodayCollisionSource","PROPHETIC_COLLISION_INDEX"]){
  assert(lobby.includes(preserved),preserved+" must remain wired");
}
console.log("PASS lunar ambience: LOD, draw budget, finite geometry, animation, Moon-only wiring and world preservation");
