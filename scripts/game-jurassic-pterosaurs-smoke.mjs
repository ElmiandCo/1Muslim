// Run from checked-out branch: node scripts/game-jurassic-pterosaurs-smoke.mjs
// Executes the actual TS scene source using the project's TypeScript compiler.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=fs.readFileSync(new URL("../app/components/JurassicPterosaurScene.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
vm.runInNewContext(compiled,{exports});
const {JURASSIC_PTEROSAUR_FLOCK:flock,jurassicPterosaurPose:pose,renderJurassicPterosaurs:render}=exports;
assert.equal(flock.length,14);
for(let i=0;i<1200;i++){
 const p=pose(i*857,i%14);
 assert.ok(p&&[p.x,p.y,p.z,p.heading,p.flap].every(Number.isFinite));
 assert.ok(p.y>30&&p.y<75&&Math.abs(p.x)<1080&&Math.abs(p.z)<1080);
}
let maxDraws=0;
for(let i=0;i<1200;i++){
 let draws=0,x=-1080+(i*137)%2160,z=-1080+(i*271)%2160;
 render((px,py,pz,sx,sy,sz,color,alpha=1,angle=0)=>{
  draws++;
  assert.ok([px,py,pz,sx,sy,sz,alpha,angle,...color].every(Number.isFinite));
  assert.ok(sx>0&&sy>0&&sz>0&&alpha>0&&alpha<=1);
 },i*551,x,z);
 maxDraws=Math.max(maxDraws,draws);
}
let far=0;render(()=>far++,0,3000,3000);
assert.equal(far,0);
assert.ok(maxDraws<=120);
const jurassic=fs.readFileSync(new URL("../app/components/JurassicScene.ts",import.meta.url),"utf8");
assert.ok(jurassic.includes('import {renderJurassicPterosaurs} from "./JurassicPterosaurScene"'));
assert.ok(jurassic.includes("renderJurassicPterosaurs(draw,now,playerX,playerZ)"));
console.log("PASS: 1200 poses, 1200 camera views, far culling, integration anchors; max draws",maxDraws);
