#!/usr/bin/env node
/**
 * Ancient Egypt / Moses integration smoke.
 * Run from repo root: node scripts/game-egypt-integration-smoke.mjs
 * Uses the project's existing TypeScript devDependency to exercise the actual
 * game module without Next.js, WebGL or an external TS loader.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root=process.cwd(),componentDir=path.join(root,"app/components");
const loaded=new Map();
function load(name){
 if(loaded.has(name))return loaded.get(name);
 const file=path.join(componentDir,name+".ts");
 const source=readFileSync(file,"utf8");
 const js=ts.transpileModule(source,{fileName:file,compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true
 }}).outputText;
 const mod={exports:{}};
 loaded.set(name,mod.exports);
 const requireLocal=(request)=>{
  assert.ok(request.startsWith("./"),"Unexpected module: "+request);
  return load(request.slice(2));
 };
 vm.runInNewContext(js,{module:mod,exports:mod.exports,require:requireLocal,console},{filename:file,timeout:5000});
 return mod.exports;
}
const world=load("gameEgyptWorld"),egypt=load("AncientEgyptRiverScene");
const physics=load("gamePhysics"),sea=load("PartedSeaScene");
let checks=0;
const ok=(condition,message)=>{assert.ok(condition,message);checks++};
ok(world.MOSES_TO_EGYPT_PORTAL.z===-14,"Origin arch at Egyptian shore");
ok(world.MOSES_TO_EGYPT_PORTAL.z>sea.SEA_SPAWN_Z,"Egypt is the side travelers flee FROM");
ok(world.EGYPT_TO_MOSES_PORTAL.z-egypt.EGYPT_SPAWN.z>=35,"Egypt spawn cannot bounce through return portal");
ok(world.EGYPT_MOSES_RETURN.z<world.MOSES_TO_EGYPT_PORTAL.z-20,"Moses return is clear of origin arch");
ok(world.MOSES_PORTAL_COLLIDERS.length===6,"Both original arches have solid pillars and lintels");
ok(sea.partedSeaColliders().length===9,"All existing Moses refuges retained");
ok(world.EGYPT_COLLIDERS.length>egypt.EGYPT_PALMS.length+egypt.EGYPT_PYRAMIDS.length*9,"Egypt solids decomposed");
ok(world.EGYPT_COLLIDERS.every(b=>[b.x,b.z,b.hx,b.hz,b.bottom,b.top].every(Number.isFinite)&&b.top>b.bottom&&b.hx>0&&b.hz>0),"Finite positive collision volumes");
ok(world.egyptTerrainFloor(-250,120)===0,"Desert is solid at ground level");
ok(world.egyptTerrainFloor(egypt.egyptRiverCenterX(120),120)===-1,"River has lowered shallow bed, not invisible surface");
const palm=egypt.EGYPT_PALMS[0];
const palmWalk=physics.resolveHorizontalGameMovement(palm.x-3,palm.z,palm.x+3,palm.z,0,world.EGYPT_COLLISION_INDEX);
ok(palmWalk.blocked,"Palm trunk blocks a walking player");
const pyramid=egypt.EGYPT_PYRAMIDS[0],stepHeight=pyramid.height/pyramid.stages;
const edgeX=pyramid.x+pyramid.base*.49;
const landing=physics.resolveVerticalGameMovement(stepHeight+3,stepHeight-2,edgeX,pyramid.z,world.EGYPT_COLLISION_INDEX);
ok(landing.landedOnSolid&&Math.abs(landing.y-stepHeight)<.001,"Stepped pyramid roof catches descending feet");
const hutX=-365,hutZ=85;
const doorway=physics.resolveHorizontalGameMovement(hutX,hutZ+8,hutX,hutZ+3,0,world.EGYPT_COLLISION_INDEX);
ok(!doorway.blocked,"Hut front doorway stays enterable");
const wall=physics.resolveHorizontalGameMovement(hutX-5,hutZ+8,hutX-5,hutZ+3,0,world.EGYPT_COLLISION_INDEX);
ok(wall.blocked,"Hut wall stays solid");
const roof=physics.resolveVerticalGameMovement(9,5,hutX,hutZ,world.EGYPT_COLLISION_INDEX);
ok(roof.landedOnSolid&&Math.abs(roof.y-7.325)<.001,"Hut roof supports player feet");
let draws=0;
const draw=(x,y,z,sx,sy,sz,color,alpha=1,angle=0)=>{
 ok([x,y,z,sx,sy,sz,alpha,angle,...color].every(Number.isFinite),"Finite terrain draw");
 ok(sx>0&&sy>0&&sz>0,"Positive terrain cube");
 draws++;
};
world.renderAncientEgyptTerrain(draw,egypt.EGYPT_SPAWN.x,egypt.EGYPT_SPAWN.y,egypt.EGYPT_SPAWN.z);
ok(draws>=40&&draws<=160,"Nearby desert/Nile geometry bounded for mobile");
const nearDraws=draws;
draws=0;
world.renderAncientEgyptReturnPortal(draw,egypt.EGYPT_SPAWN.x,egypt.EGYPT_SPAWN.z);
ok(draws>=4,"Return arch rendered near spawn");
draws=0;
world.renderAncientEgyptReturnPortal(draw,450,-450);
ok(draws===0,"Distant return portal culled visually");
const lobby=readFileSync(path.join(componentDir,"SharedGameLobby.tsx"),"utf8");
for(const token of [
 "enterPartedSeaWorld","returnFromEgyptWorld","enterEgyptWorld","exitEgyptWorld",
 "MOSES_TO_EGYPT_PORTAL","EGYPT_TO_MOSES_PORTAL","EGYPT_COLLISION_INDEX",
 "egyptTerrainFloor(p.x,p.z)","renderAncientEgyptRiverLife(egyptDraw,now,p.x,p.z)",
 "renderAncientEgyptTerrain(egyptDraw,p.x,p.y,p.z)",
 "renderPartedSea(vp,draw,now,p,partedSeaState.current)",
 "renderNabawiCongregation","renderHajjPilgrims","ROMAN_PORTAL","JURASSIC_COLLISION_INDEX",
 "FUTURE_COLLISION_INDEX","Belt Boyz"
])ok(lobby.includes(token),"Preserved game/world wiring: "+token);
ok(lobby.includes('p.world="Ancient Egypt"'),"Egypt uses independent multiplayer world name");
ok(!lobby.includes('w==="Ancient Egypt")enterPartedSeaWorld()'),"Egypt is not silently merged into Moses");
console.log("PASS: Egypt portal, reciprocal spawn, palm/pyramid/hut solids, shallow riverbed, LOD and world preservation; "+checks+" assertions, "+nearDraws+" terrain cubes at spawn");
