/**
 * Game-only Parted Sea smoke test. Run from repo root:
 *   node scripts/game-moses-smoke.mjs
 * Uses the existing TypeScript dev dependency and real scene/physics source.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const base=new URL("../app/components/",import.meta.url);
function load(file){
 const source=readFileSync(fileURLToPath(new URL(file,base)),"utf8");
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 const wrapper=vm.runInNewContext("(function(require,module,exports){"+compiled+"\n})",{performance:{now:()=>10000},Math});
 wrapper(()=>{throw Error("Unexpected scene import")},mod,mod.exports);
 return mod.exports;
}
const sea=load("PartedSeaScene.ts");
const {resolveHorizontalGameMovement}=load("gamePhysics.ts");
assert.equal(sea.SEA_LENGTH,2743);
assert.ok(sea.SEA_BOUNDS.minX<0&&sea.SEA_BOUNDS.maxX>0);
assert.equal(sea.SEA_BOUNDS.minZ,-2740);
assert.equal(sea.SEA_BOUNDS.maxZ,-3);
assert.equal(sea.SEA_SPAWN_Z,-1371.5);
const rocks=sea.partedSeaColliders();
assert.equal(rocks.length,9,"Nine refuge colliders must survive");
assert.ok(rocks.every(r=>Math.abs(r.x)+r.hx<=10.1&&r.top>3));
const block=resolveHorizontalGameMovement(-1,-240,-9,-240,0,rocks);
assert.equal(block.blocked,true,"First refuge should block movement");
assert.ok(block.x>-5,"Cannot walk through the refuge");

const state=sea.createPartedSeaState();
assert.equal(state.npcs.filter(n=>n.kind==="refugee").length,25);
assert.equal(state.npcs.filter(n=>n.kind==="soldier").length,22);
const player={x:0,y:0,z:sea.SEA_SPAWN_Z,yaw:Math.PI};
const before=state.npcs[0].z;
const quiet=sea.updatePartedSea(state,.016,10000,player,[]);
assert.equal(quiet.respawn,false);
assert.ok(state.npcs[0].z<before,"Travelers progress toward far shore");

const shot={x:-6.6,y:1.5,z:-30,prevX:-6.6,prevY:1.5,prevZ:-34,life:1};
const combat=sea.updatePartedSea(state,.016,10016,player,[shot]);
assert.ok(combat.defeated>=1,"Swept aimed shot should hit a pursuing soldier");
assert.equal(shot.life,0,"Confirmed hit consumes projectile");

let draws=0;const draw=()=>{draws++};
sea.renderPartedSea([],draw,10016,player,state);
assert.ok(draws>100&&draws<2200,"Player-local LOD should render bounded geometry");
draws=0;sea.renderPartedSea([],draw,10016,{x:0,y:0,z:10000,yaw:0},state);
assert.equal(draws,0,"Distant world geometry must be culled");

const lobby=readFileSync(fileURLToPath(new URL("SharedGameLobby.tsx",base)),"utf8");
for(const token of [
 "enterPartedSeaWorld()", "exitPartedSeaWorld()", "renderPartedSea(vp,draw,now,p,partedSeaState.current)",
 "updatePartedSea(partedSeaState.current,dt,now,p,projectiles.current)",
 "partedSeaWorldRef.current?SEA_BOUNDS",
 "partedSeaWorldRef.current?SEA_COLLIDERS",
 "resolveHorizontalGameMovement", "resolveVerticalGameMovement",
 "Masjid an-Nabawi", "Belt Boyz Council"
])assert.ok(lobby.includes(token),"Required world/engine preservation: "+token);
assert.ok(lobby.includes('w==="Time of Moses")enterPartedSeaWorld()'));
console.log("PASS: Moses/Parted Sea bounds, refugees, soldiers, shots, refuges, LOD and selector/engine wiring");
