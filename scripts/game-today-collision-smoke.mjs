/** Run from repo root: node scripts/game-today-collision-smoke.mjs */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const dir=fileURLToPath(new URL("../app/components/",import.meta.url));
const cache=new Map();
function load(file){
  const path=resolve(dir,file);
  if(cache.has(path))return cache.get(path).exports;
  const mod={exports:{}};cache.set(path,mod);
  const compiled=ts.transpileModule(readFileSync(path,"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  vm.runInNewContext("(function(require,module,exports){"+compiled+"\n})")(specifier=>{
    assert.match(specifier,/^\.\/[a-zA-Z0-9]+$/);
    return load(specifier.slice(2)+".ts");
  },mod,mod.exports);
  return mod.exports;
}
const {createTodayCollisionSource,createTodayStaticColliders,createPropheticColliders,
  PROPHETIC_COLLISION_INDEX,TODAY_PROP_COLLIDERS}=load("gameTodayColliders.ts");
const {resolveHorizontalGameMovement,resolveVerticalGameMovement}=load("gamePhysics.ts");
const terrain=(x,z)=>.12*Math.sin(x*.11)*Math.cos(z*.09)+
  Math.pow(Math.max(0,Math.sin(x*.0037)*Math.cos(z*.0041)),3)*
  Math.min(135,Math.max(0,Math.hypot(x,z)-250)*.16);
const staticSolids=createTodayStaticColliders(terrain);
const historical=createPropheticColliders();
assert.equal(staticSolids.length,251,"all Today static objects retained");
assert.equal(TODAY_PROP_COLLIDERS.length,80,"all destructible plaza props retained");
assert.equal(historical.length,122,"historical houses preserved without Today's props");
const damaged=new Map();
const indexed=createTodayCollisionSource(terrain,damaged);
const direct=[...staticSolids,...TODAY_PROP_COLLIDERS];
let parity=0;
for(let i=0;i<96;i++){
  const b=direct[(i*17)%direct.length];
  const x=b.x+Math.sin(i*1.73)*8,z=b.z+Math.cos(i*2.21)*8;
  const y=i%3===0?b.top+30:i%3===1?b.bottom+1:b.top-.1;
  const tx=x+Math.sin(i*2.7)*15,tz=z+Math.cos(i*3.1)*15;
  assert.equal(JSON.stringify(resolveHorizontalGameMovement(x,z,tx,tz,y,indexed)),
    JSON.stringify(resolveHorizontalGameMovement(x,z,tx,tz,y,direct)),
    "Today horizontal index parity "+i);
  assert.equal(JSON.stringify(resolveVerticalGameMovement(y,y-16,x,z,indexed)),
    JSON.stringify(resolveVerticalGameMovement(y,y-16,x,z,direct)),
    "Today vertical index parity "+i);
  parity+=2;
}
const prop=TODAY_PROP_COLLIDERS[0];
const bounds=[prop.x-2,prop.x+2,prop.z-2,prop.z+2];
const propsInQuery=()=>indexed.query(...bounds).filter(c=>"id" in c&&c.id===prop.id).length;
assert.equal(propsInQuery(),1,"undamaged prop remains solid");
damaged.set(prop.id,Date.now()+300000);
assert.equal(propsInQuery(),0,"destroyed prop immediately becomes non-solid");
damaged.delete(prop.id);
assert.equal(propsInQuery(),1,"repaired prop becomes solid without index rebuild");
const temple=historical[0];
assert.equal(JSON.stringify(resolveHorizontalGameMovement(temple.x-15,temple.z,temple.x+15,temple.z,0,historical)),
  JSON.stringify(resolveHorizontalGameMovement(temple.x-15,temple.z,temple.x+15,temple.z,0,PROPHETIC_COLLISION_INDEX)));
assert.equal(PROPHETIC_COLLISION_INDEX.query(prop.x-2,prop.x+2,prop.z-2,prop.z+2).some(c=>"id" in c),false,
  "Today destructible props never leak into historical scene");
console.log("PASS: "+parity+" Today movement parity checks, live damage/repair, 251 static, 80 props, 122 historical solids");
