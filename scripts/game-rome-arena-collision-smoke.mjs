/**
 * Execute after npm install: node scripts/game-rome-arena-collision-smoke.mjs
 * Exercises the ACTUAL TypeScript physics and scene exports (not duplicate
 * test-only collider math). Requires the existing TypeScript devDependency.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const ts=require("typescript");
const root=resolve(import.meta.dirname??dirname(new URL(import.meta.url).pathname),"..");
const files=[
 "app/components/gamePhysics.ts",
 "app/components/RomanArenaScene.ts",
 "app/components/gameRomanArenaColliders.ts",
 "app/components/RomanJudeaScene.ts",
 "app/components/romanLionCombatRules.ts"
];
const program=ts.createProgram(files.map(p=>resolve(root,p)),{
 target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,
 moduleResolution:ts.ModuleResolutionKind.Node10,strict:true,skipLibCheck:true,noEmit:true
});
const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,"\n")).join("\n"));
const cache=new Map();
function loadTs(file){
 const absolute=resolve(file);
 if(cache.has(absolute))return cache.get(absolute).exports;
 const source=readFileSync(absolute,"utf8");
 const result=ts.transpileModule(source,{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS
 }});
 const module={exports:{}};cache.set(absolute,module);
 const localRequire=(id)=>{
  if(!id.startsWith("."))return require(id);
  return loadTs(resolve(dirname(absolute),id.endsWith(".ts")?id:id+".ts"));
 };
 new Function("require","module","exports",result.outputText)(localRequire,module,module.exports);
 return module.exports;
}
const physics=loadTs(resolve(root,files[0]));
const arena=loadTs(resolve(root,files[1]));
const solids=loadTs(resolve(root,files[2]));
const roman=loadTs(resolve(root,files[3]));
const lion=loadTs(resolve(root,files[4]));
const {x:cx,z:cz,outerZ}=arena.ROMAN_GRAND_ARENA;
assert.equal(cx,365);assert.equal(cz,-345);
assert.ok(solids.ROMAN_ARENA_COLLIDERS.length>100);
assert.equal(roman.ROMAN_ROME_COLLIDERS.length-roman.ROMAN_JERUSALEM_COLLIDERS.length,
 solids.ROMAN_ARENA_COLLIDERS.length+1,"Rome retains its original forum solid");
const south=physics.resolveHorizontalGameMovement(cx,cz+outerZ+45,cx,cz-4,0,roman.romanJudeaCollisionIndex("Rome"));
assert.equal(south.blocked,false,"south entrance center must be walkable");
assert.ok(Math.abs(south.x-cx)<1e-5&&Math.abs(south.z-(cz-4))<1e-5);
const east=physics.resolveHorizontalGameMovement(cx+108,cz,cx+76,cz,0,roman.romanJudeaCollisionIndex("Rome"));
assert.equal(east.blocked,true,"visible east columns/seats must be solid");
assert.ok(east.x>cx+76,"cannot pass through arena tier");
const oldCity=physics.resolveHorizontalGameMovement(cx+108,cz,cx+76,cz,0,roman.romanJudeaCollisionIndex("Jerusalem"));
assert.equal(oldCity.blocked,false,"Jerusalem cannot inherit Rome arena collisions");
const portal=physics.resolveHorizontalGameMovement(0,-115,0,-90,0,roman.romanJudeaCollisionIndex("Rome"));
assert.equal(portal.blocked,false,"Rome/Jerusalem travel portal remains clear");
const near=[],mid=[],far=[];
arena.renderRomanGrandArena((...args)=>near.push(args),0,{x:cx,z:cz});
arena.renderRomanGrandArena((...args)=>mid.push(args),0,{x:cx+200,z:cz});
arena.renderRomanGrandArena((...args)=>far.push(args),0,{x:cx+450,z:cz});
assert.ok(near.length>mid.length&&mid.length>0&&far.length===0,"LOD reduces draw calls");
for(const draw of near)assert.ok(draw.slice(0,6).every(Number.isFinite),"finite arena transforms");
const query=roman.romanJudeaCollisionIndex("Rome").query(cx+85,cx+95,cz-3,cz+3);
assert.ok(query.length>0,"collision index remains populated independently of visual LOD");
const state=lion.initialLionCombatState();
assert.equal(lion.ROMAN_LION_RULES.baseSpeedMultiplier,4);
assert.equal(lion.ROMAN_LION_RULES.hitsToDefeat,5);
assert.equal(lion.ROMAN_LION_RULES.respawnDelayMs,300000);
const run=lion.lionGroundVelocity(3,4,5.5);
assert.equal(run.y,0,"lion must not fly");
assert.ok(Math.abs(Math.hypot(run.x,run.z)-22)<1e-6,"lion moves at 4x base speed");
let hit=state;
for(let i=0;i<5;i++)hit=lion.registerConfirmedLionHit(hit,1000+i);
assert.equal(hit.hits,5);assert.equal(hit.defeatedAt,1004);
assert.equal(lion.registerConfirmedLionHit(hit,1005).hits,5,"no hits after defeat");
assert.equal(lion.advanceLionRespawn(hit,301003).hits,5,"no early respawn");
assert.equal(lion.advanceLionRespawn(hit,301004).hits,0,"respawn after exactly five minutes");
assert.equal(lion.canLionLunge(state,2000,3),true);
assert.equal(lion.canLionLunge({...state,lastLungeAt:2000},2500,3),false);
console.log("PASS Rome arena TypeScript, open south gate, solid seats/columns, Rome-only index, portal, render LOD and lion rule contracts");
console.log(JSON.stringify({arenaColliders:solids.ROMAN_ARENA_COLLIDERS.length,nearDraws:near.length,midDraws:mid.length,farDraws:far.length}));
