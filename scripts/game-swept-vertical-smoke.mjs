/** Run from repository root: node scripts/game-swept-vertical-smoke.mjs */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const physicsSource=readFileSync(fileURLToPath(new URL("../app/components/gamePhysics.ts",import.meta.url)),"utf8");
const compiled=ts.transpileModule(physicsSource,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const module={exports:{}};
vm.runInNewContext("(function(module,exports){"+compiled+"})")(module,module.exports);
const {resolveVerticalGameMovement,resolveSweptVerticalGameMovement,buildStaticGameCollisionIndex}=module.exports;
const slab={x:0,z:0,hx:1,hz:1,bottom:2,top:5};

const endpoint=resolveVerticalGameMovement(9,1,8,0,[slab]);
assert.equal(endpoint.landedOnSolid,false,"endpoint-only collision misses intermediate crossing");
const dive=resolveSweptVerticalGameMovement(9,1,-8,0,8,0,[slab]);
assert.equal(dive.landedOnSolid,true,"diagonal dive must hit intermediate roof");
assert.equal(dive.y,5);
assert.equal(dive.x,0,"stop at impact position, not past roof");
assert.equal(dive.z,0);
assert.equal(dive.hitCeiling,false);
const climb=resolveSweptVerticalGameMovement(-1.75,2.25,-8,0,8,0,[slab]);
assert.equal(climb.hitCeiling,true,"diagonal ascent must hit raised underside");
assert.ok(Math.abs(climb.y-.25)<1e-8);
assert.equal(climb.x,0);
assert.equal(resolveSweptVerticalGameMovement(9,6,-8,0,8,0,[slab]).landedOnSolid,false,
  "a flight path that never crosses roof altitude must not land");
assert.equal(resolveSweptVerticalGameMovement(500,400,-8,0,8,0,[slab]).y,400,
  "high-altitude flight must never reset");
assert.equal(resolveSweptVerticalGameMovement(9,1,-8,9,8,9,[slab]).landedOnSolid,false,
  "distant path must not hit roof");
assert.equal(resolveSweptVerticalGameMovement(9,1,-8,0,8,0,[{...slab,x:6,hx:.5}]).landedOnSolid,false,
  "passing a structure after altitude crossing must not create a ghost landing");
assert.equal(resolveSweptVerticalGameMovement(9,1,0,0,0,0,[slab]).landedOnSolid,false,
  "stationary X/Z uses existing endpoint vertical resolver");

const raised={x:0,z:0,hx:2.5,hz:2.5,bottom:1,top:6};
const first=resolveSweptVerticalGameMovement(10,0,-8,0,8,0,[slab,raised]);
assert.equal(first.y,6,"highest roof crossed first must win");
const index=buildStaticGameCollisionIndex([slab,raised],2);
for(let i=0;i<100;i++){
  const a=-9+i*.13,b=8-i*.06,z=Math.sin(i)*3;
  const startY=i%2?12:-5,endY=i%2?-4:12;
  const array=resolveSweptVerticalGameMovement(startY,endY,a,z,b,-z,[slab,raised]);
  const indexed=resolveSweptVerticalGameMovement(startY,endY,a,z,b,-z,index);
  assert.equal(JSON.stringify(indexed),JSON.stringify(array),"spatial index parity case "+i);
}
const lobby=readFileSync(fileURLToPath(new URL("../app/components/SharedGameLobby.tsx",import.meta.url)),"utf8");
assert.match(lobby,/resolveSweptVerticalGameMovement\(previousFeetY,p\.y,previousX,previousZ,p\.x,p\.z,collisionSolids\)/,
  "shared game must use swept fallback across existing worlds");
assert.match(lobby,/p\.x!==previousX\|\|p\.z!==previousZ\s*\?resolveSweptVerticalGameMovement/,
  "moving players must use true interpolated roof crossing instead of endpoint-first ghost landing");
assert.match(lobby,/:resolveVerticalGameMovement\(previousFeetY,p\.y,p\.x,p\.z,collisionSolids\)/,
  "stationary players retain endpoint vertical collision");
console.log("PASS: 10 swept collision cases + 100 index parity cases + 2 shared lobby wiring checks");
