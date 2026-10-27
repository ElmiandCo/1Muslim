/** Run from repository root: node scripts/game-swept-side-smoke.mjs */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const source=readFileSync(fileURLToPath(new URL("../app/components/gamePhysics.ts",import.meta.url)),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const module={exports:{}};
vm.runInNewContext("(function(module,exports){"+compiled+"})")(module,module.exports);
const {resolveSweptSideGameMovement,resolveSweptVerticalGameMovement,
  resolveVerticalGameMovement,buildStaticGameCollisionIndex}=module.exports;

const wall={x:5,z:0,hx:.5,hz:2,bottom:0,top:12};
const drop=resolveSweptSideGameMovement(0,0,20,10,0,0,[wall]);
assert.equal(drop.blocked,true,"falling flight must not enter wall below roof");
assert.ok(drop.x>3.9&&drop.x<4.09,"stop just outside radius-expanded wall");
assert.equal(drop.z,0);
assert.equal(resolveSweptSideGameMovement(0,0,30,10,0,20,[wall]).blocked,false,
  "passing over wall stays free");
assert.equal(resolveSweptSideGameMovement(0,10,20,10,10,0,[wall]).blocked,false,
  "unrelated wall must not stop a nearby descent");
assert.equal(resolveSweptSideGameMovement(5,0,10,10,0,0,[wall]).blocked,false,
  "spawned inside wall can still escape outward");
assert.equal(resolveSweptSideGameMovement(0,0,20,10,0,20,[wall]).blocked,false,
  "level horizontal movement remains owned by existing sliding resolver");
const elevated={...wall,bottom:15,top:20};
assert.equal(resolveSweptSideGameMovement(0,0,0,10,0,1,[elevated]).blocked,false,
  "walking under a raised bridge remains free");

const lateRoof={...wall,x:9};
assert.equal(resolveVerticalGameMovement(20,0,9.5,0,[lateRoof]).landedOnSolid,true,
  "legacy endpoint check would create a false roof landing");
assert.equal(resolveSweptVerticalGameMovement(20,0,0,0,9.5,0,[lateRoof]).landedOnSolid,false,
  "actual roof crossing happened before reaching the structure");
assert.equal(resolveSweptSideGameMovement(0,0,20,9.5,0,0,[lateRoof]).blocked,true,
  "late side entry must still stop inside-wall fall");
const wideRoof={...wall,hx:2};
assert.equal(resolveSweptVerticalGameMovement(20,0,0,0,10,0,[wideRoof]).landedOnSolid,true,
  "real diagonal roof landing must be preserved");

const raised={x:5,z:0,hx:2,hz:2,bottom:8,top:12};
assert.equal(resolveSweptVerticalGameMovement(0,10,0,0,10,0,[raised]).hitCeiling,true,
  "raised underside must still stop diagonal ascent");

const solids=[wall,lateRoof,wideRoof,raised];
const indexed=buildStaticGameCollisionIndex(solids,2);
for(let i=0;i<120;i++){
  const sx=-8+i*.16,ex=12-i*.03,sz=Math.sin(i)*5,ez=Math.cos(i)*5;
  const sy=i%2?24:-2,ey=i%2?-2:18;
  const direct=resolveSweptSideGameMovement(sx,sz,sy,ex,ez,ey,solids);
  const fromIndex=resolveSweptSideGameMovement(sx,sz,sy,ex,ez,ey,indexed);
  assert.equal(JSON.stringify(fromIndex),JSON.stringify(direct),"indexed side parity "+i);
}
const lobby=readFileSync(fileURLToPath(new URL("../app/components/SharedGameLobby.tsx",import.meta.url)),"utf8");
assert.match(lobby,/resolveSweptSideGameMovement\(previousX,previousZ,previousFeetY,p\.x,p\.z,p\.y,collisionSolids\)/);
assert.match(lobby,/p\.x!==previousX\|\|p\.z!==previousZ\s*\?resolveSweptVerticalGameMovement/);
assert.match(lobby,/:resolveVerticalGameMovement\(previousFeetY,p\.y,p\.x,p\.z,collisionSolids\)/);
console.log("PASS: 11 side/roof cases + 120 indexed parity cases + 3 lobby wiring checks");
