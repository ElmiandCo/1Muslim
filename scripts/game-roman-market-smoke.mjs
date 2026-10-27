// Run with: node scripts/game-roman-market-smoke.mjs
// Exercise the actual TypeScript scene module, with only the collision-index builder stubbed.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=readFileSync("app/components/RomanJudeaScene.ts","utf8");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const sandbox={
 exports:{},
 require:(id)=>{
  assert.equal(id,"./gamePhysics","Scene must not import unrelated application modules");
  return {buildStaticGameCollisionIndex:(colliders)=>({size:colliders.length})};
 }
};
vm.runInNewContext(js,sandbox,{filename:"RomanJudeaScene.js",timeout:3000});
const {renderRomanMarketLife,renderRomanJudea,ROMAN_PORTAL,ROMAN_JERUSALEM_COLLIDERS,ROMAN_ROME_COLLIDERS}=sandbox.exports;
assert.equal(typeof renderRomanMarketLife,"function");
assert.equal(ROMAN_PORTAL.z,-90);
assert.ok(ROMAN_JERUSALEM_COLLIDERS.length>100);
assert.equal(ROMAN_ROME_COLLIDERS.length,ROMAN_JERUSALEM_COLLIDERS.length+1);
const clear=(z)=>!ROMAN_JERUSALEM_COLLIDERS.some(c=>Math.abs(c.x)<c.hx+.42&&Math.abs(z-c.z)<c.hz+.42);
assert.ok(clear(-90)&&clear(125),"Portal and spawn must remain clear");
const sample=(city,player,now=20000)=>{
 const calls=[];
 renderRomanMarketLife((...args)=>calls.push(args),now,player,city);
 return calls;
};
const near=sample("Jerusalem",{x:0,z:0});
const rome=sample("Rome",{x:0,z:0});
assert.ok(near.length>25&&rome.length>25,"Both cities must show market life");
assert.notEqual(JSON.stringify(near),JSON.stringify(rome),"Each city needs its own palette");
assert.equal(sample("Jerusalem",{x:600,z:600}).length,0,"Far market must be culled");
assert.equal(JSON.stringify(near),JSON.stringify(sample("Jerusalem",{x:0,z:0})),"Animation must be deterministic");
assert.notEqual(JSON.stringify(near),JSON.stringify(sample("Jerusalem",{x:0,z:0},25000)),"Traders and birds must animate");
assert.ok(near.some(c=>c[1]>6),"Birds must be visible above the road");
assert.ok(near.every(c=>c.slice(0,7).every(Number.isFinite)),"No invalid draw geometry");
let max=0;
for(const x of [-50,0,50])for(let z=-165;z<=165;z+=55)max=Math.max(max,sample("Jerusalem",{x,z}).length);
assert.ok(max<220,`Too many decorative draw submissions: ${max}`);
const full=[];
renderRomanJudea([], (...args)=>full.push(args),20000,{x:0,z:-90},"Jerusalem");
assert.ok(full.length>near.length,"Market helper must be wired into original scene");
console.log(`PASS Roman market runtime: ${near.length} nearby decorative calls, ${max} sampled max; deterministic, animated, culled, portal/collision intact`);
