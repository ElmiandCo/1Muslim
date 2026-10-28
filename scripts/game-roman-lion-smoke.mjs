// Run: node scripts/game-roman-lion-smoke.mjs
// Executes the committed TypeScript engine via the repo's TypeScript transpiler.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const compile=(file,deps={})=>{
 const source=readFileSync(file,"utf8");
 const js=ts.transpileModule(source,{fileName:file,compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020
 }}).outputText;
 const module={exports:{}};
 const requireModule=id=>{
  if(!(id in deps))throw Error(`Unmocked dependency ${id} in ${file}`);
  return deps[id];
 };
 runInNewContext("(function(require,module,exports){"+js+"})",{})(requireModule,module,module.exports);
 return module.exports;
};
const physics=compile("app/components/gamePhysics.ts");
const arena=compile("app/components/RomanArenaScene.ts");
const solids=compile("app/components/gameRomanArenaColliders.ts",{"./RomanArenaScene":arena});
const roman=compile("app/components/RomanJudeaScene.ts",{
 "./gamePhysics":physics,"./RomanArenaScene":arena,"./gameRomanArenaColliders":solids
});
const combat=compile("app/components/gameRomanLionCombat.ts",{"./RomanArenaScene":arena});
const lobby=readFileSync("app/components/SharedGameLobby.tsx","utf8");
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++};
const {x,z}=arena.ROMAN_GRAND_ARENA;
check(roman.ROMAN_ROME_COLLIDERS.length>roman.ROMAN_JERUSALEM_COLLIDERS.length,"Rome arena colliders are added");
check(solids.ROMAN_ARENA_COLLIDERS.length>=100,"Monumental arena has >100 solids");
check(solids.ROMAN_ARENA_COLLIDERS.every(b=>[b.x,b.z,b.hx,b.hz,b.bottom,b.top].every(Number.isFinite)),"Finite solids");
check(solids.ROMAN_ARENA_COLLIDERS.every(b=>Math.abs(b.x-x)>6||Math.abs(b.z-(z+arena.ROMAN_GRAND_ARENA.outerZ))>3),"South entrance center stays clear");
check(combat.ROMAN_LION_RUN_SPEED===5.5*4,"Lion 4x player base speed");
check(combat.ROMAN_LION_RUN_SPEED>5.5*3,"Lion faster than 3x player boost");
check(combat.ROMAN_LION_HITS_TO_DEFEAT===5,"Exactly five hits");
check(combat.ROMAN_LION_RESPAWN_MS===300000,"Exactly five-minute respawn");
const player={id:"local",x:x+30,y:0,z};
const lion=combat.createRomanLionState();
combat.updateRomanLion(lion,1000,.016,player,[]);
check(Math.hypot(lion.x-x,lion.z-z)>0,"Lion moves toward a nearby player");
check(Math.hypot(lion.x-x,lion.z-z)<=combat.ROMAN_LION_RUN_SPEED*.016+1e-6,"Chase speed is bounded");
const flying=combat.createRomanLionState();
check(!combat.updateRomanLion(flying,1000,.016,{id:"local",x,y:100,z},[]).attacked,"No airborne lion attacks");
const attack=combat.createRomanLionState();
check(combat.updateRomanLion(attack,1000,.016,{id:"local",x:x+1,y:0,z},[]).attacked,"Lion attacks grounded player");
check(!combat.updateRomanLion(attack,1100,.016,{id:"local",x:x+1,y:0,z},[]).attacked,"Attack cooldown applies");
const shotsLion=combat.createRomanLionState();
for(let i=1;i<=5;i++){
 const shot={id:`local-${i}`,owner:"local",prevX:x-30,prevY:1.5,prevZ:z,x:x+30,y:1.5,z,life:1};
 const result=combat.updateRomanLion(shotsLion,1000+i*100,0,{id:"local",x:x+60,y:0,z},[shot]);
 check(result.hits===1&&shot.life===0,`Swept shot ${i} counted once`);
 check(result.defeated===(i===5),`Defeat only at hit ${i}`);
}
check(!shotsLion.alive,"Lion inactive after five hits");
check(!combat.updateRomanLion(shotsLion,301499,0,player,[]).respawned,"No premature respawn");
check(combat.updateRomanLion(shotsLion,301500,0,player,[]).respawned,"Respawn exactly five minutes later");
check(shotsLion.alive&&shotsLion.hits===0,"Respawn restores full lion health");
const wrongOwner=combat.createRomanLionState();
const remote={id:"remote",owner:"another",x,z,y:1.5,life:1};
check(combat.updateRomanLion(wrongOwner,1000,0,{id:"local",x:x+60,y:0,z},[remote]).hits===0,"Remote spoof not counted in local prototype");
const high=combat.createRomanLionState();
const above={id:"high",owner:"local",x,z,y:100,life:1};
check(combat.updateRomanLion(high,1000,0,{id:"local",x:x+60,y:0,z},[above]).hits===0,"High-altitude shot misses");
check(lobby.includes("updateRomanLion(romanLion.current,now,dt,p,projectiles.current)"),"Game loop uses actual projectiles");
check(lobby.includes('if(lionEvent.attacked)damage("animal")'),"Lion attacks use existing shield-aware damage");
check(lobby.includes("renderRomanArenaLion("),"Visible lion renderer connected");
check(lobby.includes("renderPartedSea(")&&lobby.includes("renderHajjPilgrims(")&&lobby.includes("renderNabawiCongregation("),"Other world renderers preserved");
check(lobby.includes("EGYPT_COLLISION_INDEX")&&lobby.includes("JURASSIC_COLLISION_INDEX")&&lobby.includes("FUTURE_COLLISION_INDEX"),"Other world collision indices preserved");
console.log(`PASS ${checks} Rome lion, arena collision, and cross-world smoke assertions`);
