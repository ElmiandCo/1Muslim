#!/usr/bin/env node
/** Run: node scripts/game-egypt-long-nile-smoke.mjs
 * Executes actual TS game helpers using the repo's typescript devDependency.
 * Does not replace browser/mobile playtesting or verify multiplayer authority.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
const dir=path.join(process.cwd(),"app/components"),cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name);
 const file=path.join(dir,name+".ts");
 const js=ts.transpileModule(readFileSync(file,"utf8"),{fileName:file,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,
   esModuleInterop:true}}).outputText;
 const mod={exports:{}};cache.set(name,mod.exports);
 vm.runInNewContext(js,{module:mod,exports:mod.exports,
  require:(request)=>{assert.ok(request.startsWith("./"));return load(request.slice(2));},
  console},{filename:file,timeout:5000});
 return mod.exports;
}
const river=load("AncientEgyptRiverScene"),ext=load("gameEgyptNileExtension");
const world=load("gameEgyptWorld"),physics=load("gamePhysics");
let checks=0;const ok=(value,msg)=>{assert.ok(value,msg);checks++};
ok(ext.EGYPT_NAV_BOUNDS.minZ===-1700&&ext.EGYPT_NAV_BOUNDS.maxZ===1700,
 "3,400-unit river travel corridor");
ok(river.EGYPT_BOUNDS.minZ===-520&&river.EGYPT_BOUNDS.maxZ===520,
 "Original central Egypt scene preserved");
for(const z of [-1695,-1100,-530,530,1100,1695]){
 const x=river.egyptRiverCenterX(z),half=river.EGYPT_RIVER_WIDTH/2;
 ok(Math.abs(world.egyptTerrainFloor(x,z)+1)<1e-8,"Lowered riverbed "+z);
 ok(world.egyptTerrainFloor(x-half-4,z)===0,"West dry bank "+z);
 ok(world.egyptTerrainFloor(x+half+4,z)===0,"East dry bank "+z);
 const sloped=world.egyptTerrainFloor(x+half,z);
 ok(sloped<0&&sloped>-1,"Continuous bank slope "+z);
}
function sample(px,py,pz){
 const draws=[];
 ext.renderExtendedEgyptNileTerrain((x,y,z,sx,sy,sz,color,alpha=1)=>
  draws.push({x,y,z,sx,sy,sz,color,alpha}),px,py,pz,world.egyptTerrainFloor);
 return draws;
}
ok(sample(-28,2,120).length===0,"No duplicate extension in original Egypt center");
for(const z of [-1500,-900,900,1500]){
 const x=river.egyptRiverCenterX(z),draws=sample(x,2,z);
 ok(draws.some(d=>d.sy===.18&&Math.abs(d.z-z)<25),"Visible extended water "+z);
 ok(draws.some(d=>d.sy===.34&&Math.abs(d.z-z)<25),"Visible extended riverbed "+z);
 ok(draws.length<800,"Near-camera draw budget under 800 "+z);
 ok(draws.every(d=>[d.x,d.y,d.z,d.sx,d.sy,d.sz,d.alpha].every(Number.isFinite)&&
  d.sx>0&&d.sy>0&&d.sz>0),"Finite render geometry "+z);
}
ok(sample(0,2,0).length===0,"Far extensions culled");
ok(sample(180,1000,1500).length<1500,"High-altitude draw budget");
ok(world.EGYPT_COLLIDERS.length>=149,"Existing Egypt solids retained");
const palace=load("AncientEgyptMarketPalaceScene").EGYPT_PALACE;
const gate=physics.resolveHorizontalGameMovement(palace.x,palace.z+palace.halfDepth+16,
 palace.x,palace.z+palace.halfDepth-20,0,world.EGYPT_COLLISION_INDEX);
ok(!gate.blocked,"Palace gate remains walkable");
const lobby=readFileSync(path.join(dir,"SharedGameLobby.tsx"),"utf8");
for(const marker of ["renderAncientEgyptNileJourney","renderEgyptMarketPalace",
 "renderAncientEgyptRiverLife","EGYPT_NAV_BOUNDS as EGYPT_BOUNDS",
 "renderPartedSea","renderNabawiCongregation","Belt Boyz","ROMAN_PORTAL"])
 ok(lobby.includes(marker),"Preserved game integration: "+marker);
console.log("PASS: long Nile banks/LOD, existing Egypt solids and world imports; "+checks+" assertions");
