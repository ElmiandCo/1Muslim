import assert from "node:assert/strict";
import test from "node:test";
import {normalizeAnalog,movementFromAnalog,rotateCamera,acquirePointer,releasePointer} from "../app/game-labs/world/adventure-input.ts";
test("analog is clamped, deadzoned and camera-relative",()=>{
 assert.deepEqual(normalizeAnalog(150,100,100,100,50),{x:1,y:0});
 const diagonal=normalizeAnalog(200,200,100,100,50);
 assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-10);
 assert.equal(movementFromAnalog({x:0.05,y:0},0).intensity,0);
 const forward=movementFromAnalog({x:0,y:-1},0);assert.equal(forward.forward,1);assert.equal(forward.run,true);
 const turned=movementFromAnalog({x:0,y:-1},Math.PI/2);assert.ok(Math.abs(turned.right-1)<1e-10);
 assert.equal(movementFromAnalog({x:0,y:-0.4},0).run,false);
});
test("swipe camera clamps pitch and validates coordinates",()=>{
 assert.equal(rotateCamera({yaw:0,pitch:0},100,0).yaw,-0.4);
 assert.equal(rotateCamera({yaw:0,pitch:0},0,10000).pitch,-1.2);
 assert.throws(()=>normalizeAnalog(0,0,0,0,0),RangeError);
 assert.throws(()=>rotateCamera({yaw:0,pitch:0},NaN,0),RangeError);
});
test("two fingers own independent movement and look channels",()=>{
 const empty={movePointer:null,lookPointer:null};
 const move=acquirePointer(empty,1,"move");
 const both=acquirePointer(move,2,"look");
 assert.deepEqual(both,{movePointer:1,lookPointer:2});
 assert.deepEqual(acquirePointer(both,3,"move"),both);
 assert.deepEqual(releasePointer(both,1),{movePointer:null,lookPointer:2});
 assert.deepEqual(releasePointer(both,2),{movePointer:1,lookPointer:null});
});
