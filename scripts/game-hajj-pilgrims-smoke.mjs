// Run from repository root: node scripts/game-hajj-pilgrims-smoke.mjs
// Imports the real TypeScript Hajj scene through the existing TypeScript dev dependency.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import ts from "typescript";

const source=readFileSync(resolve("app/components/HajjPilgrimScene.ts"),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {
  hajjRouteLengths,hajjPilgrimState,renderHajjPilgrims,
  HISTORICAL_HAJJ_LAYOUT,TODAY_HAJJ_LAYOUT,
  TAWAF_CIRCUITS,SAI_TRIPS,HAJJ_WALK_SPEED,HAJJ_PILGRIM_COUNT
}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));

assert.equal(TAWAF_CIRCUITS,7);
assert.equal(SAI_TRIPS,7);
assert.equal(HAJJ_PILGRIM_COUNT,12);
let cases=0;
for(const layout of [HISTORICAL_HAJJ_LAYOUT,TODAY_HAJJ_LAYOUT]){
  const lengths=hajjRouteLengths(layout);
  const at=distance=>hajjPilgrimState(distance/HAJJ_WALK_SPEED*1000,0,layout);
  assert.equal(at(0).phase,"tawaf");
  for(let lap=1;lap<=7;lap++){
    const s=at(lap*lengths.circumference+1e-5);
    assert.equal(s.tawafCircuitsCompleted,lap,"Must finish each complete tawaf circuit");
    if(lap<7)assert.equal(s.phase,"tawaf");
    cases++;
  }
  assert.equal(at(lengths.tawaf+.001).phase,"approach","Transition to Safa must follow seven circuits");
  assert.equal(at(lengths.tawaf+lengths.approach+.001).phase,"sai");
  for(let leg=1;leg<=7;leg++){
    const d=lengths.tawaf+lengths.approach+leg*lengths.saiTrip+.00001;
    const s=at(d);
    assert.equal(s.saiTripsCompleted,leg,"Must finish exactly seven Safa–Marwa traversals");
    if(leg<7)assert.equal(s.phase,"sai");
    cases++;
  }
  const end=at(lengths.tawaf+lengths.approach+lengths.sai+.001);
  assert.equal(end.phase,"complete");
  assert.equal(end.x,layout.marwaX);
  assert.equal(end.z,layout.marwaZ,"Seventh traversal must finish at Marwa");
  const draw=(x,z,now=20000)=>{
    const calls=[];
    renderHajjPilgrims((...args)=>calls.push(args),now,x,z,layout);
    return calls;
  };
  assert.equal(draw(2000,2000).length,0,"Far NPCs must be visually culled");
  const near=draw(layout.kaabaX,layout.kaabaZ);
  assert(near.length>0&&near.length<=HAJJ_PILGRIM_COUNT*7,"Mobile draw-call budget");
  for(const args of near){
    assert(args.slice(0,6).every(Number.isFinite),"Finite positions and dimensions");
    assert(args.slice(3,6).every(n=>n>0),"Positive geometry dimensions");
    assert(args[6].length===3&&args[6].every(n=>Number.isFinite(n)&&n>=0&&n<=1),"RGB range");
    assert(args[7]>=0&&args[7]<=1,"Opacity range");
  }
  assert.notDeepEqual(draw(layout.kaabaX,layout.kaabaZ,20000),draw(layout.kaabaX,layout.kaabaZ,26000),"NPCs must animate");
  // Existing historical buildings have these footprints; Hajj NPC routes must not pass through them.
  if(layout===HISTORICAL_HAJJ_LAYOUT){
    const solids=[];
    for(let i=0;i<84;i++){
      const col=i%12,row=Math.floor(i/12),x=(col-5.5)*42,z=(row-3)*53;
      if(Math.abs(x)<44&&Math.abs(z)<44)continue;
      solids.push({x,z,hx:11,hz:13});
    }
    for(let t=0;t<=lengths.tawaf+lengths.approach+lengths.sai;t+=2){
      const p=at(t);
      assert(!solids.some(s=>Math.abs(p.x-s.x)<s.hx+.5&&Math.abs(p.z-s.z)<s.hz+.5),
        "Historical pilgrim route must not cross existing solid buildings");
    }
  }
}
const lobby=readFileSync(resolve("app/components/SharedGameLobby.tsx"),"utf8");
assert.equal((lobby.match(/renderHajjPilgrims\(/g)||[]).length,2,"Both Kaaba scenes must render the pilgrims once");
assert(lobby.includes("HISTORICAL_HAJJ_LAYOUT")&&lobby.includes("TODAY_HAJJ_LAYOUT"));
for(const preserved of ["renderPartedSea","renderRomanJudea","drawJurassic","renderFutureWorld","renderLunarResearchLife","PROPHETIC_COLLISION_INDEX","createTodayCollisionSource"]){
  assert(lobby.includes(preserved),preserved+" must remain connected");
}
console.log("PASS Hajj pilgrims: "+cases+" ritual boundaries, route clearance, 2-world wiring, finite geometry, animation, LOD and preservation");
