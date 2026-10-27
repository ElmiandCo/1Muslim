#!/usr/bin/env node
// Run: node --experimental-strip-types scripts/game-ancient-egypt-smoke.mjs
// Node 22.16+; no browser/WebGL or external dependencies required.
import assert from "node:assert/strict";
import {
 EGYPT_BOUNDS,EGYPT_PALMS,EGYPT_WORKERS,EGYPT_BOATS,EGYPT_BIRDS,
 EGYPT_RIVER_WIDTH,EGYPT_PYRAMIDS,EGYPT_DOCKS,EGYPT_DOCK_CREWS,EGYPT_RIVER_WILDLIFE,
 egyptRiverCenterX,ancientEgyptSolidProps,egyptWorkerPose,egyptBoatPose,egyptDockWorkerPose,
 renderAncientEgyptRiverLife
} from "../app/components/AncientEgyptRiverScene.ts";
let checks=0;
function ok(condition,message){assert.ok(condition,message);checks++;}
ok(EGYPT_PALMS.length>=45,"Palm clusters are populated");
ok(EGYPT_WORKERS.length>=20,"Worker population exists");
ok(EGYPT_BOATS.length>=3,"River craft exist");
ok(EGYPT_BIRDS.length>=8,"Ambient birds exist");
ok(EGYPT_PYRAMIDS.length>=3,"Construction sites exist");
ok(EGYPT_RIVER_WIDTH>=40,"Navigable river width");
for(const palm of EGYPT_PALMS){
 ok(palm.height>8&&Number.isFinite(palm.x+palm.z),"Palm geometry finite");
 ok(Math.abs(palm.x-egyptRiverCenterX(palm.z))>EGYPT_RIVER_WIDTH/2+10,"Trunks stay out of water");
}
const props=ancientEgyptSolidProps();
ok(props.length===EGYPT_PALMS.length+EGYPT_PYRAMIDS.length+EGYPT_DOCKS.length+6+8,"Expected collider descriptors");
ok(new Set(props.map(p=>p.id)).size===props.length,"Unique collider ids");
for(const p of props){
 ok(p.hx>0&&p.hz>0&&p.top>p.bottom,"Positive finite solid volumes");
 ok(Number.isFinite(p.x+p.z+p.hx+p.hz+p.bottom+p.top),"Solid coordinates finite");
}
for(const now of [0,1000,60000,720000]){
 for(let i=0;i<EGYPT_WORKERS.length;i++){
  const w=egyptWorkerPose(now,i);
  ok(Number.isFinite(w.x+w.z+w.heading+w.step),"Worker pose finite");
 }
 for(let i=0;i<EGYPT_BOATS.length;i++){
  const boat=egyptBoatPose(now,i);
  ok(Math.abs(boat.x-egyptRiverCenterX(boat.z))<.001,"Boat follows Nile curve");
 }
}
function capture(now,x,z){
 let count=0;const draws=[];
 const draw=(xx,y,zz,sx,sy,sz,color,alpha=1,angle=0)=>{
  count++;
  assert.ok([xx,y,zz,sx,sy,sz,alpha,angle,...color].every(Number.isFinite),"Finite WebGL draw");
  assert.ok(sx>0&&sy>0&&sz>0,"Positive geometry dimensions");
  if(count<10)draws.push([xx,y,zz]);
 };
 renderAncientEgyptRiverLife(draw,now,x,z);
 return {count,draws};
}
const bank=capture(30000,140,120),construction=capture(30000,-145,-145);
const far=capture(30000,450,1000);
ok(bank.count>20,"Riverbank scene draws");
ok(construction.count>20,"Construction scene draws");
ok(far.count===0,"Distant scenery culled");
ok(bank.count<1000&&construction.count<1000,"Mobile draw budget capped per scene");
const moving=capture(33000,140,120);
ok(moving.count>0,"Animated scene updates without throwing");
ok(EGYPT_BOUNDS.minZ<EGYPT_BOUNDS.maxZ,"World bounds sane");
ok(EGYPT_DOCK_CREWS.length===EGYPT_DOCKS.length*2,"Two unloading workers per dock");
ok(EGYPT_RIVER_WILDLIFE.length===12,"River wildlife count is bounded");
for(const now of [0,1000,4500,9000,25000]){
 for(let i=0;i<EGYPT_DOCK_CREWS.length;i++){
  const w=egyptDockWorkerPose(now,i);
  const crew=EGYPT_DOCK_CREWS[i],z=EGYPT_DOCKS[crew.dockIndex]+crew.offset;
  const dockX=egyptRiverCenterX(z)-EGYPT_RIVER_WIDTH/2-5;
  ok(Number.isFinite(w.x+w.z+w.heading+w.step),"Dock worker pose is finite");
  ok(w.x<=dockX&&w.x>=dockX-15,"Unloading remains on west bank");
  ok(w.z===z,"Unloading path stays at its assigned dock");
 }
}
ok(egyptDockWorkerPose(0,0).carrying&&!egyptDockWorkerPose(4500,0).carrying,
 "Cargo carried toward shore, empty-handed on return");
const dock=EGYPT_DOCKS[1],dockX=egyptRiverCenterX(dock)-EGYPT_RIVER_WIDTH/2-5;
const dockScene=capture(1200,dockX,dock);
ok(dockScene.count>20&&dockScene.count<1000,"Dock ambience stays within draw budget");
const wildlife=EGYPT_RIVER_WILDLIFE.map(w=>w.kind);
ok(wildlife.includes("fish")&&wildlife.includes("heron"),"Two Nile wildlife types present");
console.log("PASS Ancient Egypt riverlife smoke:",checks,"assertions; bank draws",bank.count,
 "construction draws",construction.count,"far draws",far.count);
