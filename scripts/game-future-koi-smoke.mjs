// Run from repo root: node scripts/game-future-koi-smoke.mjs
// Tests the actual FutureCityScene.ts source, not a copied model of its math.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source=readFileSync(new URL("../app/components/FutureCityScene.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exports={};
vm.runInNewContext(js,{exports,Math,Array,Number,Object},{filename:"FutureCityScene.js"});
const {renderFutureGardens,renderFutureWorld,futureSkywayFloor,FUTURE_PORTAL,FUTURE_SKYWAYS}=exports;
assert.equal(typeof renderFutureGardens,"function");
assert.equal(typeof renderFutureWorld,"function");
assert.deepEqual([FUTURE_PORTAL.x,FUTURE_PORTAL.z],[0,-76]);
assert.equal(FUTURE_SKYWAYS.length,4);
assert.equal(futureSkywayFloor(0,32,132),32);
assert.equal(futureSkywayFloor(0,32,500),-Infinity);
let checks=0,maxGardenDraws=0;
function drawGarden(x,z,time){
 const calls=[];
 renderFutureGardens([],(_vp,px,y,pz,sx,sy,sz,color,alpha=1,angle=0)=>{
  for(const n of [px,y,pz,sx,sy,sz,alpha,angle,...color]){assert.ok(Number.isFinite(n),"non-finite render parameter");checks++}
  assert.ok(alpha>=0&&alpha<=1,"alpha outside 0..1");checks++;
  calls.push({x:px,z:pz,alpha});
 },x,z,time);
 maxGardenDraws=Math.max(maxGardenDraws,calls.length);
 return calls;
}
assert.equal(drawGarden(1200,1200,0).length,0,"distant gardens must be culled");
const close=drawGarden(-72,0,1000);
assert.ok(close.length>0&&close.length<=220,"mobile garden draw budget");
const fish=close.filter(c=>c.alpha===.54);
assert.equal(fish.length,4,"two koi per near-detail basin; two nearby basins visible");
const moved=drawGarden(-72,0,5000).filter(c=>c.alpha===.54);
assert.notEqual(fish[0].x,moved[0].x,"koi animate with time");
for(let i=0;i<400;i++)drawGarden(-420+i*2.2,220*Math.sin(i*.3),i*175);
assert.ok(source.includes("renderFutureGardens(vp,draw,playerX,playerZ,now)"),"garden must be wired into the actual Future renderer");
assert.ok(source.includes("// World exit: actual spatial destination"),"portal visuals preserved");
assert.ok(source.includes("// Automated elevated traffic"),"traffic preserved");
assert.ok(source.includes("// Service robots and citizens"),"citizens preserved");
console.log("PASS Future City koi garden smoke:",checks,"finite/alpha assertions; max garden draw calls",maxGardenDraws,"; portal/skyways preserved");
