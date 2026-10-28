#!/usr/bin/env node
/** Run from a checked-out game branch: node scripts/game-egypt-long-nile-palm-solids-smoke.mjs
 * Executes committed TypeScript helpers with the existing typescript dependency.
 * Does NOT verify browser rendering, mobile FPS or multiplayer authority.
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
const life=load("AncientEgyptLongNileLifeScene");
const palms=load("gameEgyptLongNilePhysics");
const world=load("gameEgyptWorld");
const physics=load("gamePhysics");
const river=load("AncientEgyptRiverScene");
let checks=0;const ok=(value,msg)=>{assert.ok(value,msg);checks++};
const trunks=palms.createLongNilePalmColliders();
ok(trunks.length===64,"Exactly 64 solid trunks for 64 visible palms");
ok(world.EGYPT_COLLIDERS.length>=149+trunks.length,"District and oasis solids retained");
ok(world.EGYPT_NAV_BOUNDS.minZ===-1700&&world.EGYPT_NAV_BOUNDS.maxZ===1700,
 "Long Nile navigation bounds retained");
for(let i=0;i<trunks.length;i++){
 const c=trunks[i],p=life.LONG_NILE_OASIS_PALMS[i];
 ok(c.x===p.x&&c.z===p.z&&c.hx===.575&&c.hz===.575,
  "Trunk exactly matches visual width and center "+i);
 ok(c.bottom===0&&Math.abs(c.top-p.height*.9)<1e-9,
  "Trunk height matches visual "+i);
 ok(Math.abs(c.z)>520&&Math.abs(c.z)<1700,
  "No new central-scene collider "+i);
 const shore=Math.abs(c.x-river.egyptRiverCenterX(c.z));
 ok(shore>river.EGYPT_RIVER_WIDTH/2+3,
  "Navigable river channel stays clear "+i);
 const near=world.EGYPT_COLLISION_INDEX.query(c.x-.2,c.x+.2,c.z-.2,c.z+.2);
 ok(near.some(b=>b.x===c.x&&b.z===c.z&&b.top===c.top),
  "Indexed even outside draw LOD "+i);
 const ground=physics.resolveHorizontalGameMovement(c.x-4,c.z,c.x+4,c.z,0,
  world.EGYPT_COLLISION_INDEX);
 ok(ground.blocked&&ground.x<c.x-c.hx,
  "Ground movement cannot pass through palm "+i);
 const airborne=physics.resolveHorizontalGameMovement(c.x-4,c.z,c.x+4,c.z,c.top+3,
  world.EGYPT_COLLISION_INDEX);
 ok(!airborne.blocked&&Math.abs(airborne.x-(c.x+4))<1e-6,
  "Flying above palm stays unrestricted "+i);
 const landing=physics.resolveVerticalGameMovement(c.top+4,c.top-1,c.x,c.z,
  world.EGYPT_COLLISION_INDEX);
 ok(landing.landedOnSolid&&Math.abs(landing.y-c.top)<1e-8,
  "Descending player lands on trunk top "+i);
}
const source=readFileSync(path.join(dir,"SharedGameLobby.tsx"),"utf8");
for(const anchor of ["renderExtendedEgyptNileLife","renderPartedSea","renderNabawiCongregation",
 "Belt Boyz","ROMAN_PORTAL","EGYPT_NAV_BOUNDS as EGYPT_BOUNDS"])
 ok(source.includes(anchor),"Existing world integration: "+anchor);
console.log("PASS: long Nile oasis trunk geometry/index/ground collision/flight/landing; "+
 checks+" assertions");
