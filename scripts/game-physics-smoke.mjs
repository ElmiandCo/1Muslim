/**
 * Run from repository root: node scripts/game-physics-smoke.mjs
 * Loads the actual game TypeScript helpers and scene geometry without Next.js,
 * a browser, external assets or new dependencies (uses installed typescript).
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const componentDir=fileURLToPath(new URL("../app/components/",import.meta.url));
const cache=new Map();
function load(file){
  const path=resolve(componentDir,file);
  if(cache.has(path))return cache.get(path).exports;
  const mod={exports:{}};cache.set(path,mod);
  const source=readFileSync(path,"utf8");
  const compiled=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
  }}).outputText;
  const wrapper=vm.runInNewContext("(function(require,module,exports){\n"+compiled+"\n})");
  wrapper(specifier=>{
    assert.match(specifier,/^\.\/[a-zA-Z0-9]+$/);
    return load(specifier.slice(2)+".ts");
  },mod,mod.exports);
  return mod.exports;
}
const {resolveHorizontalGameMovement,resolveVerticalGameMovement}=load("gamePhysics.ts");
const {JURASSIC_COLLIDERS,FUTURE_COLLIDERS}=load("gameWorldColliders.ts");
const {GIANT_CAVE,jurassicTrees,jurassicTerrain}=load("JurassicScene.ts");

const wall={x:2,z:0,hx:.15,hz:5,bottom:0,top:12};
const hit=resolveHorizontalGameMovement(0,0,5,0,0,[wall]);
assert.equal(hit.blocked,true,"boosted player must not tunnel through thin wall");
assert.ok(hit.x<1.5,"swept movement must stop before wall");
const slide=resolveHorizontalGameMovement(0,0,5,5,0,[wall]);
assert.ok(slide.blocked&&slide.z>1,"player should slide along wall");
const escaped=resolveHorizontalGameMovement(2,0,5,0,0,[wall]);
assert.ok(escaped.x>4,"player spawned inside geometry should escape");

const raised={x:0,z:0,hx:4,hz:4,bottom:24,top:26};
const ceiling=resolveVerticalGameMovement(20,25,0,0,[raised]);
assert.equal(ceiling.hitCeiling,true);
assert.ok(Math.abs(ceiling.y-22.25)<1e-6,"underside stops ascending avatar head");
const roof=resolveVerticalGameMovement(30,23,0,0,[raised]);
assert.equal(roof.landedOnSolid,true);
assert.equal(roof.y,26);
const high=resolveVerticalGameMovement(300,260,0,0,[raised]);
assert.equal(high.y,260,"high altitude must not reset");
assert.equal(high.landedOnSolid,false);
const away=resolveVerticalGameMovement(30,23,10,10,[raised]);
assert.equal(away.y,23,"distant roof must not affect flight");
const inside=resolveVerticalGameMovement(24.5,25,0,0,[raised]);
assert.equal(inside.hitCeiling,false,"already intersecting geometry must not teleport player");

assert.equal(FUTURE_COLLIDERS.length,76,"64 towers + 4 decks + 8 supports");
assert.ok(JURASSIC_COLLIDERS.length>1000,"Jurassic trees, rocks and cave need solid geometry");
const futureBridge=resolveVerticalGameMovement(28,33,0,-220,FUTURE_COLLIDERS);
assert.equal(futureBridge.hitCeiling,true,"future skyway must have a solid underside");
assert.ok(Math.abs(futureBridge.y-(32-.36-1.75))<1e-6);
const caveLintel=resolveVerticalGameMovement(50,60,GIANT_CAVE.x,GIANT_CAVE.z+60,JURASSIC_COLLIDERS);
assert.equal(caveLintel.hitCeiling,true,"cave lintel must stop upward flight");
assert.equal(caveLintel.y,54-1.75);
const caveLanding=resolveVerticalGameMovement(80,65,GIANT_CAVE.x,GIANT_CAVE.z+60,JURASSIC_COLLIDERS);
assert.equal(caveLanding.y,70,"cave roof must be landable");
const mouthBlocked=JURASSIC_COLLIDERS.some(b=>
  Math.abs(GIANT_CAVE.x-b.x)<b.hx+.42&&
  Math.abs(GIANT_CAVE.z+60-b.z)<b.hz+.42&&
  1.75>b.bottom&&0<b.top
);
assert.equal(mouthBlocked,false,"cave entrance must remain walkable");
const firstTree=jurassicTrees.find(t=>Math.hypot(t.x-GIANT_CAVE.x,t.z-GIANT_CAVE.z)>=145);
assert.ok(firstTree);
const ground=jurassicTerrain(firstTree.x,firstTree.z);
const treeHit=resolveHorizontalGameMovement(firstTree.x-5,firstTree.z,firstTree.x+5,firstTree.z,ground,JURASSIC_COLLIDERS);
assert.equal(treeHit.blocked,true,"tree trunk must be solid");
const highTree=resolveHorizontalGameMovement(firstTree.x-8,firstTree.z,firstTree.x+8,firstTree.z,250,JURASSIC_COLLIDERS);
assert.equal(highTree.blocked,false,"flying well above canopy must remain free");
console.log("PASS: 16 game physics/world-collider assertions");
