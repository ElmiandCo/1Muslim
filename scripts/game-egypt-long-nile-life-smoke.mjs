// Run in a checked-out game branch: node scripts/game-egypt-long-nile-life-smoke.mjs
// Source-executes the real TS scene with a mocked read-only river-center dependency.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=fs.readFileSync(new URL("../app/components/AncientEgyptLongNileLifeScene.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const scene={};
const center=z=>185+16*Math.sin(z*.007);
vm.runInNewContext(compiled,{exports:scene,require:path=>{
 assert.equal(path,"./AncientEgyptRiverScene");
 return {EGYPT_RIVER_WIDTH:55,egyptRiverCenterX:center};
}});
const {LONG_NILE_OASIS_PALMS:palms,LONG_NILE_REED_BEDS:reeds,LONG_NILE_SKIFFS:skiffs,
 LONG_NILE_HERONS:herons,longNileSkiffPose:pose,renderExtendedEgyptNileLife:render}=scene;
assert.equal(palms.length,64);assert.equal(reeds.length,24);
assert.equal(skiffs.length,8);assert.equal(herons.length,16);
for(const p of [...palms,...reeds,...skiffs,...herons])
 assert.ok(Math.abs(p.z)>520&&Math.abs(p.z)<=1700,"scenery outside old central scene");
let maxDraws=0;
for(let k=0;k<600;k++){
 const x=-300+(k*127)%900,z=-1700+(k*167)%3400;
 let draws=0;
 render((xx,y,zz,sx,sy,sz,color,alpha=1,angle=0)=>{
  draws++;
  assert.ok([xx,y,zz,sx,sy,sz,alpha,angle,...color].every(Number.isFinite));
  assert.ok(sx>0&&sy>0&&sz>0&&alpha>=0&&alpha<=1);
  assert.ok(Math.abs(zz)>520,"no central scene draw");
 },k*389,x,z);
 maxDraws=Math.max(maxDraws,draws);
}
assert.ok(maxDraws<200,"bounded per-view draw budget");
for(let k=0;k<900;k++){
 const p=pose(k*701,k%8);
 assert.ok([p.x,p.z,p.bob,p.heading].every(Number.isFinite));
 assert.ok(Math.abs(p.z)>520&&Math.abs(p.z)<=1700);
 assert.ok(Math.abs(p.x-center(p.z))<15,"leave central navigation lane clear");
}
let farDraws=0;render(()=>farDraws++,0,0,0);
assert.equal(farDraws,0,"no out-of-range rendering");
console.log("PASS: 600 camera positions, 900 skiff poses, zero central draws, max draw callbacks",maxDraws);
