// Deterministic pure-physics regression tests; no browser or network required.
// Run: npm run test:game-physics
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const source=readFileSync(new URL("../app/components/gamePhysics.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {gravityForWorld,stepProjectile,hitSphere,hitSweptSphere}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const point=(x,y,z)=>({x,y,z});
test("world gravity mapping",()=>{
 assert.equal(gravityForWorld("Jurassic"),9.81);
 assert.equal(gravityForWorld("Time of Moses"),9.81);
 assert.equal(gravityForWorld("Future"),9.81);
 assert.equal(gravityForWorld("lunar research"),1.62);
 assert.equal(gravityForWorld("Future",true),1.62);
 assert.equal(gravityForWorld("space orbit"),0);
});
test("straight lasers preserve elevation by default",()=>{
 const s={x:0,y:10,z:0,vx:20,vy:0,vz:0,life:2};
 stepProjectile(s,.05);assert.equal(s.y,10);assert.equal(s.x,1);assert.equal(s.life,1.95);
});
test("ballistic shots fall differently on Earth, Moon and space",()=>{
 const mk=()=>({x:0,y:10,z:0,vx:0,vy:0,vz:0,life:2});
 const e=mk(),m=mk(),z=mk();
 stepProjectile(e,.05,gravityForWorld("Jurassic"));
 stepProjectile(m,.05,gravityForWorld("lunar"));
 stepProjectile(z,.05,gravityForWorld("orbit"));
 assert.ok(e.y<m.y&&m.y<z.y);assert.equal(z.y,10);
});
test("time step is clamped, negative time does not rewind",()=>{
 const s={x:0,y:0,z:0,vx:10,vy:0,vz:0,life:1};
 stepProjectile(s,2);assert.equal(s.x,.5);
 stepProjectile(s,-1);assert.equal(s.x,.5);
});
test("swept hit catches high-speed tunneling",()=>{
 assert.equal(hitSphere(point(0,0,0),point(10,0,0),1),false);
 assert.equal(hitSweptSphere(point(-10,0,0),point(10,0,0),point(0,0,0),1),true);
});
test("swept hit rejects near misses and endpoints outside",()=>{
 assert.equal(hitSweptSphere(point(-10,2,0),point(10,2,0),point(0,0,0),1),false);
 assert.equal(hitSweptSphere(point(2,0,0),point(3,0,0),point(0,0,0),1),false);
 assert.equal(hitSweptSphere(point(2,0,0),point(3,0,0),point(0,0,0),-1),false);
});
test("stationary projectile and tangential hits",()=>{
 assert.equal(hitSweptSphere(point(0,0,0),point(0,0,0),point(0,0,0),1),true);
 assert.equal(hitSweptSphere(point(-2,1,0),point(2,1,0),point(0,0,0),1),true);
 assert.equal(hitSweptSphere(point(-2,1.01,0),point(2,1.01,0),point(0,0,0),1),false);
});
