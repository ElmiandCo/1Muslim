#!/usr/bin/env node
/** Egypt district physics regression: run from repo root with
 * node scripts/game-egypt-district-smoke.mjs (requires devDependency typescript).
 * No browser, mobile or multiplayer authority is simulated here.
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
 const mod={exports:{}};
 cache.set(name,mod.exports);
 vm.runInNewContext(js,{module:mod,exports:mod.exports,
  require:(request)=>{assert.ok(request.startsWith("./"));return load(request.slice(2));},
  console},{filename:file,timeout:5000});
 return mod.exports;
}
const scene=load("AncientEgyptMarketPalaceScene");
const district=load("gameEgyptDistrictPhysics");
const world=load("gameEgyptWorld");
const physics=load("gamePhysics");
const solids=district.createEgyptDistrictColliders();
let checks=0;
const ok=(value,why)=>{assert.ok(value,why);checks++};
ok(solids.length===149,"149 geometry-matched static district solids");
ok(world.EGYPT_COLLIDERS.length>=solids.length,"District included in existing Egypt collision index");
ok(solids.every(b=>[b.x,b.z,b.hx,b.hz,b.bottom,b.top].every(Number.isFinite)&&
 b.hx>0&&b.hz>0&&b.top>b.bottom),"All collision volumes finite and positive");
const {x,z,halfWidth:hw,halfDepth:hd,gateWidth:gw}=scene.EGYPT_PALACE;
const move=(ax,az,bx,bz,y=0)=>physics.resolveHorizontalGameMovement(
 ax,az,bx,bz,y,world.EGYPT_COLLISION_INDEX);
const gate=move(x,z+hd+16,x,z+hd-20);
ok(!gate.blocked&&Math.abs(gate.z-(z+hd-20))<1e-6,
 "Open southern palace gate admits walking player");
ok(move(x+hw+9,z,x+hw-9,z).blocked,"Palace east perimeter solid");
ok(move(x-hw-9,z,x-hw+9,z).blocked,"Palace west perimeter solid");
ok(move(x,z-hd-9,x,z-hd+9).blocked,"Palace north wall solid");
for(const side of [-1,1]){
 const px=x+side*(gw/2+6);
 ok(move(px,z+hd+15,px,z+hd-10).blocked,"Gate pylon solid");
}
const lintel=physics.resolveVerticalGameMovement(20,12,x,z+hd+3,world.EGYPT_COLLISION_INDEX);
ok(lintel.landedOnSolid&&Math.abs(lintel.y-16.3)<1e-6,
 "Flying player can land on palace lintel, while passage below stays open");
const market=scene.EGYPT_MARKET;
const lane=move(market.x,market.z-55,market.x,market.z+55);
ok(!lane.blocked&&Math.abs(lane.z-(market.z+55))<1e-6,
 "Central market lane traversable end-to-end");
for(let row=0;row<market.rows;row++)for(let col=0;col<market.columns;col++){
 if(col===2)continue;
 const sx=market.x+(col-2)*21,sz=market.z+(row-1)*26;
 ok(move(sx-11,sz,sx,sz).blocked,"Market stall solid: "+row+"/"+col);
 const landing=physics.resolveVerticalGameMovement(10,3,sx,sz,world.EGYPT_COLLISION_INDEX);
 ok(landing.landedOnSolid&&Math.abs(landing.y-6.325)<1e-6,
  "Market awning supports descending feet: "+row+"/"+col);
}
const draws=[];
scene.renderEgyptMarketPalace((x,y,z,sx,sy,sz)=>draws.push({x,y,z,sx,sy,sz}),
 0,x,z);
ok(draws.some(b=>Math.abs(b.x-(x+hw))<1e-8&&Math.abs(b.z-z)<1e-8&&
 Math.abs(b.sy-9.6)<1e-8),"Actual palace side wall rendered");
ok(draws.some(b=>Math.abs(b.x-x)<1e-8&&Math.abs(b.z-(z+hd+3))<1e-8&&
 Math.abs(b.sy-2)<1e-8),"Actual palace lintel rendered");
draws.length=0;
scene.renderEgyptMarketPalace((x,y,z,sx,sy,sz)=>draws.push({x,y,z,sx,sy,sz}),
 0,market.x,market.z);
ok(draws.some(b=>Math.abs(b.x-(market.x-21))<1e-8&&
 Math.abs(b.z-market.z)<1e-8&&Math.abs(b.sy-.8)<1e-8),
 "Actual market stall rendered");
draws.length=0;
scene.renderEgyptMarketPalace(()=>draws.push(1),0,1000,1000);
ok(draws.length===0,"Visual LOD can cull without removing static collision");
const lobby=readFileSync(path.join(dir,"SharedGameLobby.tsx"),"utf8");
for(const token of ["renderEgyptMarketPalace","EGYPT_COLLISION_INDEX",
 "renderAncientEgyptRiverLife","renderPartedSea","renderNabawiCongregation",
 "renderHajjPilgrims","Belt Boyz","ROMAN_PORTAL"])
 ok(lobby.includes(token),"Existing world integration preserved: "+token);
console.log("PASS: Egypt palace/market physical entry, 12 stalls, roof landing, LOD and worlds; "+
 checks+" assertions");
