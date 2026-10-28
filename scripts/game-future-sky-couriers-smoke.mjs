// Run from a checked-out game branch: node scripts/game-future-sky-couriers-smoke.mjs
// Executes the real TypeScript module; no browser, physics or network required.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=fs.readFileSync(new URL("../app/components/FutureSkyCourierScene.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const scene={};
vm.runInNewContext(compiled,{exports:scene});
const {FUTURE_COURIER_ROUTES:routes,futureCourierPose:pose,renderFutureSkyCouriers:render}=scene;
assert.equal(routes.length,12,"exactly 12 low-cost couriers");
for(const route of routes){
 assert.ok(route.radius<280&&route.altitude>150&&route.altitude<230,"above towers, inside Future City");
}
let maxDraws=0;
for(let i=0;i<1200;i++){
 const x=-400+(i*137)%800,z=-400+(i*227)%800,now=i*671;
 let draws=0;
 render([],(_vp,px,py,pz,sx,sy,sz,color,alpha=1,angle=0)=>{
  draws++;
  assert.ok([px,py,pz,sx,sy,sz,alpha,angle,...color].every(Number.isFinite));
  assert.ok(sx>0&&sy>0&&sz>0&&alpha>=0&&alpha<=1);
 },now,x,z);
 maxDraws=Math.max(maxDraws,draws);
}
assert.ok(maxDraws<120,"bounded per-view draw budget");
for(let i=0;i<1200;i++){
 const p=pose(i*900,i%12);
 assert.ok([p.x,p.y,p.z,p.heading].every(Number.isFinite));
 assert.ok(p.y>160&&Math.abs(p.x)<380&&Math.abs(p.z)<380);
}
let farDraws=0;render([],()=>farDraws++,0,1000,1000);
assert.equal(farDraws,0,"far cameras render no couriers");
console.log("PASS: 1200 camera views, 1200 courier poses, max draw callbacks",maxDraws);
